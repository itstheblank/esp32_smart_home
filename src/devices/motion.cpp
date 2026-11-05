#include "motion.h"
#include "config.h"

void Motion::init(IMqtt &m)
{
  mqtt = &m;
  pinMode(PIR_PIN, INPUT);
  logic.reset(digitalRead(PIR_PIN) == HIGH, millis());
}

void Motion::loop()
{
  bool newStable = false;
  if (logic.step(digitalRead(PIR_PIN) == HIGH, millis(), &newStable))
  {
    if (mqtt->connected())
    {
      mqtt->publishState(TOPIC_STATE_MOTION, newStable ? "DETECTED" : "CLEAR");
    }
    Serial.printf("=> PIR stable state -> %s\n", newStable ? "DETECTED" : "CLEAR");
  }
}
