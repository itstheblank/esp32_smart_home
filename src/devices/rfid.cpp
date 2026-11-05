#include "rfid.h"
#include "door.h"
#include "config.h"
#include "rfid_logic.h"
#include <SPI.h>
#include <stdio.h>

void Rfid::init(IMqtt &m, Door &d)
{
  mqtt = &m;
  door = &d;
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  reader.PCD_Init();
  Serial.printf("=> RC522 initialized (SS=%u, RST=%u)\n", RFID_SS_PIN, RFID_RST_PIN);
}

void Rfid::loop()
{
  if (!reader.PICC_IsNewCardPresent() || !reader.PICC_ReadCardSerial())
    return;

  char uid[2 * sizeof(reader.uid.uidByte) + 1];
  if (!rfid_format_uid(reader.uid.uidByte, reader.uid.size, uid, sizeof(uid)))
  {
    Serial.println("=> ERROR: invalid RFID UID, dropped");
    return;
  }

  const char *result = rfid_check_access(uid, RFID_ALLOWED_UIDS, RFID_ALLOWED_UID_COUNT);
  Serial.printf("=> RFID UID=%s -> %s\n", uid, result);
  if (strcmp(result, RFID_RESULT_GRANTED) == 0)
    door->open();
  publishAccess(uid, result);

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
