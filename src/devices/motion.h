#ifndef MOTION_H
#define MOTION_H

#include <Arduino.h>
#include "motion_logic.h"

class Motion
{
public:
  void init();
  // Returns true exactly once per rising edge (LOW -> HIGH)
  bool loop();

private:
  bool lastActive;
};

#endif // MOTION_H
