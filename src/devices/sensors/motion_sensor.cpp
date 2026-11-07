#include "motion_sensor.h"
#include "core/log_service.h"
#include <Arduino.h>

void MotionSensor::init(uint8_t deviceId, uint8_t pirPin)
{
  id = deviceId;
  pin = pirPin;
  pinMode(pin, INPUT);
  logic.reset(digitalRead(pin) == HIGH, millis());
  LogService::instance().logAction("MOTION_SENSOR", id,
                                   logic.stableState() ? "MOTION_DETECTED" : "MOTION_CLEAR", true);
}

MotionSensorEvent MotionSensor::loop()
{
  bool newStable = false;
  if (logic.step(digitalRead(pin) == HIGH, millis(), &newStable))
  {
    Serial.printf("=> MotionSensor (id=%u, pin=%u) stable state -> %s\n",
                  id, pin, newStable ? "DETECTED" : "CLEAR");
    const char *action = newStable ? "MOTION_DETECTED" : "MOTION_CLEAR";
    LogService::instance().logAction("MOTION_SENSOR", id, action, true);
    return newStable ? MotionSensorEvent::MOTION_DETECTED : MotionSensorEvent::MOTION_CLEAR;
  }
  return MotionSensorEvent::NONE;
}
