#include "rfid_reader.h"
#include "config.h"
#include "core/log_service.h"
#include <SPI.h>
#include <string.h>

void RfidReader::init(uint8_t deviceId, uint8_t chipSelectPin, uint8_t resetPin)
{
  id = deviceId;
  ssPin = chipSelectPin;
  rstPin = resetPin;
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, ssPin);
  reader.PCD_Init(ssPin, rstPin);
  byte version = reader.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.printf("=> RC522 initialized (id=%u, SS=%u, RST=%u)\n", id, ssPin, rstPin);
  Serial.printf("=> RC522 version register: 0x%02X (0x91/0x92 = OK, 0x00/0xFF = wiring/power fault)\n", version);
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

  // Directly log the RFID event to smarthome/logs
  LogService::instance().logRfid(id, event.tagId, event.tagLen, true);

  // Always release the card so it is not re-read.
  reader.PICC_HaltA();
  reader.PCD_StopCrypto1();
  return event;
}
