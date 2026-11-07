#ifndef MOTION_SENSOR_EVENTS_H
#define MOTION_SENSOR_EVENTS_H

#include <stdint.h>

// Pure logic — no Arduino.h, host-testable
enum class MotionSensorEvent : uint8_t
{
  NONE = 0,
  MOTION_DETECTED,
  MOTION_CLEAR
};

#endif // MOTION_SENSOR_EVENTS_H
