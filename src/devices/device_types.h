#ifndef DEVICE_TYPES_H
#define DEVICE_TYPES_H

#include <stdint.h>

// Pure logic — no Arduino.h, host-testable (docs/development.md)
enum class DeviceType : uint8_t
{
  LIGHT,
  DOOR,
  MOTION_SENSOR,
  RFID_READER
};

#endif // DEVICE_TYPES_H
