#include "command_dispatcher.h"
#include "mqtt_service.h"
#include "log_service.h"
#include "config.h"
#include <Arduino.h>
#include <ArduinoJson.h>

void CommandDispatcher::begin(Light *l, Door *d)
{
  light = l;
  door = d;

  MqttService::instance().onCommand(TOPIC_CMD, [](const char *payload, unsigned int len) {
    CommandDispatcher::instance().dispatch(payload, len);
  });
}

void CommandDispatcher::dispatch(const char *payload, unsigned int length)
{
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err)
  {
    Serial.printf("=> ERROR: Command JSON parse failed: %s\n", err.c_str());
    LogService::instance().logAction("UNKNOWN", 0, "INVALID_JSON", false);
    return;
  }

  const char *device = doc["device"];
  uint8_t id = doc["id"] | 0;
  const char *action = doc["action"];

  if (!device || !action)
  {
    Serial.println("=> ERROR: Command missing 'device' or 'action'");
    LogService::instance().logAction(device ? device : "UNKNOWN", id, action ? action : "MISSING_FIELD", false);
    return;
  }

  if (strcmp(device, "LIGHT") == 0 && light && id == light->getId())
  {
    LightAction lightAction;
    if (!light_action_from_string(action, &lightAction))
    {
      Serial.printf("=> ERROR: Invalid light action '%s'\n", action);
      LogService::instance().logAction("LIGHT", id, action, false);
      return;
    }
    light->executeAction(lightAction); // Device logs itself on execution
  }
  else if (strcmp(device, "DOOR") == 0 && door && id == door->getId())
  {
    DoorAction doorAction;
    if (!door_action_from_string(action, &doorAction))
    {
      Serial.printf("=> ERROR: Invalid door action '%s'\n", action);
      LogService::instance().logAction("DOOR", id, action, false);
      return;
    }
    door->executeAction(doorAction); // Device logs itself on execution
  }
  else
  {
    Serial.printf("=> ERROR: Unknown device '%s' or id %u\n", device, id);
    LogService::instance().logAction(device, id, action, false);
  }
}
