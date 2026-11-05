#include "motion.h"
#include "config.h"

void Motion::init(IMqtt &m)
{
  mqtt = &m;
  pinMode(PIR_PIN, INPUT);
  logic.reset(digitalRead(PIR_PIN) == HIGH, millis());
  // Initial stable state overwrites any stale retained value from a previous run
  const char *initial = logic.stableState() ? "DETECTED" : "CLEAR";
  mqtt->publishState(TOPIC_STATE_MOTION, initial);
  Serial.printf("=> Published: %s\n", initial);
}

void Motion::loop()
{
  bool newStable = false;
  if (logic.step(digitalRead(PIR_PIN) == HIGH, millis(), &newStable))
  {
    Serial.printf("=> PIR stable state -> %s\n", newStable ? "DETECTED" : "CLEAR");
    if (mqtt->connected())
    {
      mqtt->publishState(TOPIC_STATE_MOTION, newStable ? "DETECTED" : "CLEAR");
      Serial.printf("=> Published: %s\n", newStable ? "DETECTED" : "CLEAR");
    }
  }
}
