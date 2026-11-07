#ifndef MOTION_SENSOR_H
#define MOTION_SENSOR_H

#include <stdint.h>
#include "config.h"
#include "motion_sensor_debounce.h"
#include "motion_sensor_events.h"
#include <devices/device_types.h>

class MotionSensor
{
public:
  void init(uint8_t id, uint8_t pin);
  // Returns MOTION_DETECTED or MOTION_CLEAR on transition, or NONE if unchanged.
  MotionSensorEvent loop();
  bool isDetected() const { return logic.stableState(); }
  uint8_t getId() const { return id; }

private:
  DeviceType type = DeviceType::MOTION_SENSOR;
  uint8_t id = 0;
  uint8_t pin = 0;
  MotionDebounceLogic logic{PIR_STABLE_MS};
};

using Motion = MotionSensor;

#endif // MOTION_SENSOR_H
