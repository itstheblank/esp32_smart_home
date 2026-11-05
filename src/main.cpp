#include <Arduino.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "automation/light_motion.h"
#include "automation/rfid_door.h"
#include "devices/door.h"
#include "devices/motion.h"
#include "devices/light.h"
#include "devices/rfid.h"

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
static void handleDoorCommand(const char *payload, unsigned int length)
{
  door.handleCommand(payload, length);
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

  door.init(mqtt); // Initial state: Closed (0 degrees)
  motion.init(mqtt);
  light.init(mqtt, LIGHT_PIN);
  rfid.init(mqtt);

  light_motion_setup(motion, light);
  rfid_door_setup(rfid, door);
}

void loop()
{
  network_loop();
  mqtt.loop();
  motion.loop();
  light_motion_loop();
  light.loop();
  rfid.loop();
  rfid_door_loop();
}
