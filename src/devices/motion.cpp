#include "motion.h"
#include "config.h"

void Motion::init(IMqtt &m)
{
  mqtt = &m;
  pinMode(PIR_PIN, INPUT);
  logic.reset(digitalRead(PIR_PIN) == HIGH, millis());
  state.mark(); // publish initial stable state once connected
}

void Motion::loop()
{
  bool newStable = false;
  if (logic.step(digitalRead(PIR_PIN) == HIGH, millis(), &newStable))
  {
    Serial.printf("=> PIR stable state -> %s\n", newStable ? "DETECTED" : "CLEAR");
    state.mark();
  }
  if (state.shouldPublish(mqtt->connected()))
  {
    mqtt->publishState(TOPIC_STATE_MOTION, logic.stableState() ? "DETECTED" : "CLEAR");
    Serial.printf("=> Published: %s\n", logic.stableState() ? "DETECTED" : "CLEAR");
  }
}
