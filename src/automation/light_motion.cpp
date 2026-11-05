#include "light_motion.h"
#include "devices/actuators/light.h"
#include "devices/motion.h"

static Motion *motionPtr = nullptr;
static Light *lightPtr = nullptr;
static bool lastStable = false;

void light_motion_setup(Motion &motion, Light &light)
{
  motionPtr = &motion;
  lightPtr = &light;
  lastStable = motion.stableMotion();
}

void light_motion_loop()
{
  const bool stable = motionPtr->stableMotion();
  if (stable != lastStable)
  {
    lastStable = stable;
    lightPtr->handleMotionTransition(stable);
  }
}
