#include "rfid.h"
#include "config.h"
#include "rfid_output_access.h"
#include <SPI.h>
#include <stdio.h>

void Rfid::init(IMqtt &m)
{
  mqtt = &m;
  eventPending = false;
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  reader.PCD_Init();
  Serial.printf("=> RC522 initialized (SS=%u, RST=%u)\n", RFID_SS_PIN, RFID_RST_PIN);
}

void Rfid::loop()
{
  if (!reader.PICC_IsNewCardPresent() || !reader.PICC_ReadCardSerial())
    return;

  char uid[2 * sizeof(reader.uid.uidByte) + 1];
  if (rfid_format_uid(reader.uid.uidByte, reader.uid.size, uid, sizeof(uid)))
  {
    const char *result = rfid_check_access(uid, RFID_ALLOWED_UIDS, RFID_ALLOWED_UID_COUNT);
    Serial.printf("=> RFID UID=%s -> %s\n", uid, result);
    if (publishAccess(uid, result))
    {
      snprintf(pending.uid, sizeof(pending.uid), "%s", uid);
      pending.result = result;
      eventPending = true;
    }
  }
  else
  {
    Serial.println("=> ERROR: invalid RFID UID, dropped");
  }

  // Always release the card, even on error paths, so it is not re-read.
  reader.PICC_HaltA();
  reader.PCD_StopCrypto1();
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

bool Rfid::takeAccessEvent(AccessEvent &out)
{
  if (!eventPending)
    return false;
  snprintf(out.uid, sizeof(out.uid), "%s", pending.uid);
  out.result = pending.result;
  eventPending = false;
  return true;
}
