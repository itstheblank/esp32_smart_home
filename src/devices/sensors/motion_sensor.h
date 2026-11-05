#ifndef MOTION_SENSOR_H
#define MOTION_SENSOR_H

#include "config.h"
#include "core/mqtt_service.h"
#include "motion_sensor_debounce.h"
#include "motion_sensor_events.h"
#include <devices/device_types.h>

class MotionSensor
{
public:
  void init(uint8_t id, MqttService &mqtt, uint8_t pin);
  MotionSensorEvent loop();

private:
  DeviceType type = DeviceType::MOTION_SENSOR;
  uint8_t id;
  MqttService *mqtt;
  uint8_t pin;
  MotionDebounceLogic logic{PIR_STABLE_MS};
};

using Motion = MotionSensor;

#endif // MOTION_SENSOR_H
