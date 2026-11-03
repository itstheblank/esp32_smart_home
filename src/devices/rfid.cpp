#include "rfid.h"
#include "config.h"
#include <stdio.h>

void Rfid::init(IMqtt &m)
{
  mqtt = &m;
}

void Rfid::loop()
{
  // TODO(Member 2): read card UID, whitelist check -> GRANTED/DENIED,
  // then call publishAccess(uid, result). See docs/mqtt-contract.md §2.
}

// Builds the contract JSON and sends it as a non-retained event.
// Returns false and drops the payload if it would exceed 128 bytes (contract §2).
bool Rfid::publishAccess(const char *uid, const char *result)
{
  char json[128];
  int n = snprintf(json, sizeof(json), "{\"uid\":\"%s\",\"result\":\"%s\"}", uid, result);
  if (n < 0 || n >= (int)sizeof(json))
  {
    Serial.println("=> ERROR: access event exceeds 128 bytes, dropped");
    return false;
  }
  return mqtt->publishEvent(TOPIC_EVENT_ACCESS, json);
}
