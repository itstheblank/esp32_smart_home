#include <Arduino.h>
#include <string.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "devices/door.h"
#include "devices/motion.h"
#include "devices/door_logic.h"
#include "devices/light_logic.h"

static Door door;
static Motion motion;
static MqttService mqtt;

// Light command handler (M1-06)
static void handleLightCommand(const char *payload, unsigned int)
{
  switch (light_parse_command(payload))
  {
  case LightCommand::ON:
    mqtt.publishState(TOPIC_STATE_LIGHT, "ESP32 SEND ON");
    Serial.println("=> Published: ESP32 SEND ON");
    // TODO: Call light_on() from Member 3 here
    break;
  case LightCommand::OFF:
    mqtt.publishState(TOPIC_STATE_LIGHT, "ESP32 SEND OFF");
    Serial.println("=> Published: ESP32 SEND OFF");
    // TODO: Call light_off() from Member 3 here
    break;
  default:
    Serial.println("=> ERROR: Invalid light command, ignored!");
    break;
  }
}

// Door command handler (M1-06)
static void handleDoorCommand(const char *payload, unsigned int)
{
  switch (door_parse_command(payload))
  {
  case DoorCommand::OPEN:
    door.open();
    mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND OPEN");
    Serial.println("=> Published: ESP32 SEND OPEN");
    break;
  case DoorCommand::CLOSE:
    door.close();
    mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED");
    Serial.println("=> Published: ESP32 SEND CLOSED");
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
}

void loop()
{
  network_loop();
  mqtt.loop();

  // --- PIR MOTION DETECTION (IO39) ---
  if (motion.loop())
  {
    Serial.println("=> Motion DETECTED on IO39!");

    // 1. Send message: ESP32 DETECT MOTION
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_MOTION, "ESP32 DETECT MOTION");
      Serial.println("=> Published: ESP32 DETECT MOTION");
    }

    // 2. Open the door
    door.open();
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND OPEN");
      Serial.println("=> Published: ESP32 SEND OPEN");
    }

    // 3. Wait 2 seconds (servicing MQTT loop in background)
    unsigned long waitStart = millis();
    while (millis() - waitStart < 2000)
    {
      if (mqtt.connected())
      {
        mqtt.loop();
      }
      delay(10);
    }

    // 4. Send message: ESP32 SEND CLOSED
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED");
      Serial.println("=> Published: ESP32 SEND CLOSED");
    }

    // 5. Close the door
    door.close();
  }
}
