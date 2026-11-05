#include <Arduino.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "automation/device_action.h"
#include "automation/rule_engine.h"
#include "devices/actuators/door.h"
#include "devices/actuators/door_actions.h"
#include "devices/sensors/motion_sensor.h"
#include "devices/actuators/light.h"
#include "devices/actuators/light_actions.h"
#include "devices/sensors/rfid_reader.h"

static Door door;
static Motion motion;
static Light light;
static Rfid rfid;
static MqttService mqtt;

// Rule table — empty until the rule service (parse + store) lands.
static Rule rules[RULE_MAX_RULES];
static uint8_t ruleCount = 0;

static void execute_rule_action(const RuleAction &action)
{
  DeviceType deviceType;
  if (!device_type_from_code(action.deviceType, &deviceType))
  {
    Serial.printf("=> Unknown rule action device type %u\n", action.deviceType);
    return;
  }

  switch (deviceType)
  {
  case DeviceType::LIGHT:
  {
    LightAction lightAction;
    if (light_action_from_code(action.deviceAction, &lightAction))
      light.executeAction(lightAction);
    break;
  }
  case DeviceType::DOOR:
  {
    DoorAction doorAction;
    if (door_action_from_code(action.deviceAction, &doorAction))
      door.executeAction(doorAction);
    break;
  }
  default:
    Serial.println("=> Rule action targets a sensor, ignored");
    break;
  }
}

static void apply_event(const DeviceEvent &event)
{
  RuleAction actions[RULE_MAX_ACTIONS];
  uint8_t count = rule_engine_dispatch(rules, ruleCount, event, actions, RULE_MAX_ACTIONS);
  for (uint8_t i = 0; i < count; i++)
    execute_rule_action(actions[i]);
}

static void handleLightCommand(const char *payload, unsigned int)
{
  LightAction action;
  if (!light_action_from_string(payload, &action))
  {
    Serial.println("=> ERROR: Invalid light command, ignored!");
    return;
  }
  light.executeAction(action);
}

static void handleDoorCommand(const char *payload, unsigned int)
{
  DoorAction action;
  if (!door_action_from_string(payload, &action))
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

  door.init(1, mqtt, SERVO_PIN);
  motion.init(1, mqtt, PIR_PIN);
  light.init(1, mqtt, LIGHT_PIN);
  rfid.init(1, mqtt, RFID_SS_PIN, RFID_RST_PIN);
}

void loop()
{
  network_loop();
  mqtt.loop();

  DeviceEvent event;
  if (device_event_from_motion(motion.loop(), 1, &event))
    apply_event(event);

  if (device_event_from_rfid(rfid.loop(), 1, &event))
    apply_event(event);
}
