#include <Arduino.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "automation/light_motion.h"
#include "automation/rfid_door.h"
#include "devices/actuators/door.h"
#include "devices/actuators/door_actions.h"
#include "devices/sensors/motion.h"
#include "devices/actuators/light.h"
#include "devices/actuators/light_actions.h"
#include "devices/sensors/rfid.h"

static Door door;
static Motion motion;
static Light light;
static Rfid rfid;
static MqttService mqtt;

// Light command handler (M1-06): parse payload -> feed the manual rule path
static void handleLightCommand(const char *payload, unsigned int)
{
  LightAction action;
  if (!light_action_from_payload(payload, &action))
  {
    Serial.println("=> ERROR: Invalid light command, ignored!");
    return;
  }
  light_motion_manual(action);
}

// Door command handler (M1-06): parse payload -> execute on the actuator
static void handleDoorCommand(const char *payload, unsigned int)
{
  DoorAction action;
  if (!door_action_from_payload(payload, &action))
  {
    Serial.println("=> ERROR: Invalid door command, ignored!");
    return;
  }
  door.executeAction(action);
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

  // Wait for the broker.
  const unsigned long connectDeadline = millis() + 15000;
  while (!mqtt.connected() && millis() < connectDeadline)
  {
    mqtt.loop();
  }

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
  rfid.loop();
  rfid_door_loop();
}
