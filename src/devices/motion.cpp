#include "motion.h"

#define PIR_PIN 39

void Motion::init()
{
  lastActive = false;
  pinMode(PIR_PIN, INPUT);
}

bool Motion::loop()
{
  bool currentActive = digitalRead(PIR_PIN) == HIGH;
  bool rising = motion_is_rising(lastActive, currentActive);
  lastActive = currentActive;
  return rising;
}
