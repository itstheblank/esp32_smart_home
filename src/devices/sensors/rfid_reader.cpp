#include "rfid_reader.h"
#include "config.h"
#include <SPI.h>
#include <string.h>

void RfidReader::init(uint8_t deviceId, IMqtt &m, uint8_t chipSelectPin, uint8_t resetPin)
{
  id = deviceId;
  mqtt = &m;
  ssPin = chipSelectPin;
  rstPin = resetPin;
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, ssPin);
  reader.PCD_Init(ssPin, rstPin);
  Serial.printf("=> RC522 initialized (SS=%u, RST=%u)\n", ssPin, rstPin);
}

RfidReaderEventData RfidReader::loop()
{
  RfidReaderEventData event;
  event.event = RfidReaderEvent::NONE;
  event.tagLen = 0;

  if (!reader.PICC_IsNewCardPresent() || !reader.PICC_ReadCardSerial())
    return event;

  event.event = RfidReaderEvent::RFID_TAG_DETECTED;
  event.tagLen = reader.uid.size < sizeof(event.tagId) ? reader.uid.size : sizeof(event.tagId);
  memcpy(event.tagId, reader.uid.uidByte, event.tagLen);
  Serial.printf("=> RFID tag read (%u bytes)\n", event.tagLen);

  // Always release the card so it is not re-read.
  reader.PICC_HaltA();
  reader.PCD_StopCrypto1();
  return event;
}

// Builds the access JSON and sends it as a non-retained event.
// Returns false and drops the payload if it would exceed 128 bytes.
bool RfidReader::publishAccess(const char *uid, const char *result)
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
