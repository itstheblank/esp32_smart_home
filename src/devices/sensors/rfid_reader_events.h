#ifndef RFID_READER_EVENTS_H
#define RFID_READER_EVENTS_H

#include <stdint.h>

// Pure logic — no Arduino.h, host-testable
enum class RfidReaderEvent : uint8_t
{
  NONE,
  RFID_TAG_DETECTED,
};

struct RfidReaderEventData
{
  RfidReaderEvent event;
  uint8_t tagId[8];
  uint8_t tagLen;
};

#endif // RFID_READER_EVENTS_H
