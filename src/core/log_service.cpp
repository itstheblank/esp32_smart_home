#include "log_service.h"
#include "mqtt_service.h"
#include "config.h"
#include <Arduino.h>
#include <stdio.h>

static const size_t MAX_LOG_PAYLOAD = 192;

bool LogService::logAction(const char *device, uint8_t id, const char *action, bool success, const char *dataJson)
{
  if (!MqttService::instance().connected())
    return false;

  char payload[MAX_LOG_PAYLOAD];
  int n = snprintf(payload, sizeof(payload),
                   "{\"device\":\"%s\",\"id\":%u,\"action\":\"%s\",\"success\":%s,\"data\":%s}",
                   device ? device : "UNKNOWN",
                   id,
                   action ? action : "",
                   success ? "true" : "false",
                   (dataJson && dataJson[0] != '\0') ? dataJson : "{}");

  if (n < 0 || (size_t)n >= sizeof(payload))
  {
    Serial.println("=> ERROR: Log payload exceeded buffer size, dropped!");
    return false;
  }

  Serial.printf("=> Published [smarthome/logs]: %s\n", payload);
  return MqttService::instance().publishEvent(TOPIC_LOGS, payload);
}

bool LogService::logRfid(uint8_t id, const uint8_t *tagId, uint8_t tagLen, bool success)
{
  char hex[17] = {0};
  uint8_t len = tagLen < 8 ? tagLen : 8;
  for (uint8_t i = 0; i < len; i++)
  {
    snprintf(&hex[i * 2], 3, "%02X", tagId[i]);
  }

  char dataJson[64];
  snprintf(dataJson, sizeof(dataJson), "{\"tagId\":\"%s\",\"tagLen\":%u}", hex, len);
  return logAction("RFID_READER", id, "RFID_TAG_DETECTED", success, dataJson);
}

bool LogService::logSystem(const char *action, bool success)
{
  return logAction("SYSTEM", 0, action, success, "{}");
}
