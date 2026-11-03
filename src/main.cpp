#include <Arduino.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "devices/door.h"
#include "devices/motion.h"
#include "devices/light.h"
#include "devices/rfid.h"
#include "devices/door_logic.h"
#include "automation/motion_door.h"

static Door door;
static Motion motion;
static Light light;
static Rfid rfid;
static MqttService mqtt;

// Light command handler (M1-06)
static void handleLightCommand(const char *payload, unsigned int length)
{
  light.handleCommand(payload, length);
}

// Door command handler (M1-06)
static void handleDoorCommand(const char *payload, unsigned int)
{
  switch (door_parse_command(payload))
  {
  case DoorCommand::OPEN:
    door.open();
    mqtt.publishState(TOPIC_STATE_DOOR, "OPEN");
    Serial.println("=> Published: OPEN");
    break;
  case DoorCommand::CLOSE:
    door.close();
    mqtt.publishState(TOPIC_STATE_DOOR, "CLOSED");
    Serial.println("=> Published: CLOSED");
    break;
  default:
    Serial.println("=> ERROR: Invalid door command, ignored!");
    break;
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("Initializing WiFi module...");

  network_begin(WIFI_SSID, WIFI_PASSWORD);

  // Setup MQTT Broker
  mqtt.begin(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID, TOPIC_STATE_ONLINE);
  mqtt.onCommand(TOPIC_CMD_LIGHT, handleLightCommand);
  mqtt.onCommand(TOPIC_CMD_DOOR, handleDoorCommand);

  motion.init();
  door.init(); // Initial state: Closed (0 degrees)
  light.init(mqtt);
  rfid.init(mqtt);

  motion_door_setup(motion, door, mqtt);
}

void loop()
{
  network_loop();
  mqtt.loop();
  motion_door_loop();
  light.loop();
  rfid.loop();
}
