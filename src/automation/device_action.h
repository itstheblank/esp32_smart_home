#ifndef DEVICE_ACTION_H
#define DEVICE_ACTION_H

#include <stdint.h>
#include "devices/device_types.h"
#include "devices/sensors/motion_sensor_events.h"
#include "devices/sensors/rfid_reader_events.h"

// Pure logic — no Arduino.h, host-testable

// Generic event model
struct DeviceEvent
{
  DeviceType deviceType;
  uint8_t deviceId;
  uint8_t deviceEvent;
};

// Maps a rule/JSON device-type byte to a DeviceType. Unknown codes are rejected.
inline bool device_type_from_code(uint8_t code, DeviceType *out)
{
  if (out == nullptr || code > static_cast<uint8_t>(DeviceType::RFID_READER))
    return false;
  *out = static_cast<DeviceType>(code);
  return true;
}

// Converts a motion sensor result. Returns false if no event occurred.
inline bool device_event_from_motion(MotionSensorEvent event, uint8_t deviceId, DeviceEvent *out)
{
  if (out == nullptr || event == MotionSensorEvent::NONE)
    return false;
  out->deviceType = DeviceType::MOTION_SENSOR;
  out->deviceId = deviceId;
  out->deviceEvent = static_cast<uint8_t>(event);
  return true;
}

// Converts a RFID reader result. Returns false when the reader reported no new card.
inline bool device_event_from_rfid(const RfidReaderEventData &data, uint8_t deviceId, DeviceEvent *out)
{
  if (out == nullptr || data.event != RfidReaderEvent::RFID_TAG_DETECTED)
    return false;
  out->deviceType = DeviceType::RFID_READER;
  out->deviceId = deviceId;
  out->deviceEvent = static_cast<uint8_t>(data.event);
  return true;
}

#endif // DEVICE_ACTION_H
