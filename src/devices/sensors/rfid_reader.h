#ifndef RFID_READER_H
#define RFID_READER_H

#include <Arduino.h>
#include <MFRC522.h>
#include "rfid_reader_events.h"
#include <devices/device_types.h>

class RfidReader
{
public:
  void init(uint8_t id, uint8_t ssPin, uint8_t rstPin);
  // Returns NONE, or RFID_TAG_DETECTED with the raw tag id on a card read.
  RfidReaderEventData loop();
  uint8_t getId() const { return id; }

private:
  DeviceType type = DeviceType::RFID_READER;
  uint8_t id = 0;
  uint8_t ssPin = 0;
  uint8_t rstPin = 0;
  MFRC522 reader;
};

using Rfid = RfidReader;

#endif // RFID_READER_H
