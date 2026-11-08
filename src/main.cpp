#include <Arduino.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"
#include "core/log_service.h"
#include "core/command_dispatcher.h"
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
      light.executeAction(lightAction); // Device logs itself on execution
    break;
  }
  case DeviceType::DOOR:
  {
    DoorAction doorAction;
    if (door_action_from_code(action.deviceAction, &doorAction))
      door.executeAction(doorAction); // Device logs itself on execution
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

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("Initializing WiFi module...");

  network_begin(WIFI_SSID, WIFI_PASSWORD);

  // Initialize devices
  door.init(1, SERVO_PIN);
  motion.init(1, PIR_PIN);
  light.init(1, LIGHT_PIN);
  rfid.init(1, RFID_SS_PIN, RFID_RST_PIN);

  // Setup MQTT Broker singleton with LWT on TOPIC_LOGS
  MqttService::instance().begin(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID, TOPIC_LOGS);

  // Register command dispatcher BEFORE connecting
  CommandDispatcher::instance().begin(&light, &door);

  // Wait for the broker connection.
  const unsigned long connectDeadline = millis() + 15000;
  while (!MqttService::instance().connected() && millis() < connectDeadline)
  {
    MqttService::instance().loop();
  }

  // Publish initial states to smarthome/logs once connected
  LogService::instance().logAction("LIGHT", light.getId(), "OFF", true);
  LogService::instance().logAction("DOOR", door.getId(), "CLOSE", true);
  LogService::instance().logAction("MOTION_SENSOR", motion.getId(),
                                   motion.isDetected() ? "MOTION_DETECTED" : "MOTION_CLEAR", true);
}

void loop()
{
  network_loop();
  MqttService::instance().loop();

  // Motion sensor evaluation (device logs itself on state transition)
  MotionSensorEvent motionEvent = motion.loop();
  if (motionEvent != MotionSensorEvent::NONE)
  {
    DeviceEvent event;
    if (device_event_from_motion(motionEvent, motion.getId(), &event))
      apply_event(event);
  }

  // RFID reader evaluation (device logs itself on tag detection)
  RfidReaderEventData rfidData = rfid.loop();
  if (rfidData.event == RfidReaderEvent::RFID_TAG_DETECTED)
  {
    DeviceEvent event;
    if (device_event_from_rfid(rfidData, rfid.getId(), &event))
      apply_event(event);
  }
}
