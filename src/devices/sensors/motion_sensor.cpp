#include "motion_sensor.h"
#include "config.h"

void MotionSensor::init(uint8_t deviceId, MqttService &m, uint8_t pirPin)
{
  id = deviceId;
  mqtt = &m;
  pin = pirPin;
  pinMode(pin, INPUT);
  logic.reset(digitalRead(pin) == HIGH, millis());
  // Initial stable state overwrites any stale retained value from a previous run
  const char *initial = logic.stableState() ? "DETECTED" : "CLEAR";
  mqtt->publishState(TOPIC_STATE_MOTION, initial);
  Serial.printf("=> Published: %s\n", initial);
}

MotionSensorEvent MotionSensor::loop()
{
  bool newStable = false;
  if (logic.step(digitalRead(pin) == HIGH, millis(), &newStable))
  {
    const char *state = newStable ? "DETECTED" : "CLEAR";
    Serial.printf("=> PIR stable state -> %s\n", state);
    if (mqtt && mqtt->connected())
    {
      mqtt->publishState(TOPIC_STATE_MOTION, state);
      Serial.printf("=> Published: %s\n", state);
    }
  }
  return logic.stableState() ? MotionSensorEvent::MOTION_DETECTED : MotionSensorEvent::MOTION_CLEAR;
}
