#include "light_motion.h"
#include "config.h"
#include "devices/actuators/light.h"
#include "devices/actuators/light_automation.h"
#include "devices/sensors/motion.h"

static Motion *motionPtr = nullptr;
static Light *lightPtr = nullptr;
static LightAutomation automation(MOTION_NO_MOTION_TIMEOUT_MS);
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
    LightAction action;
    if (automation.handleStableTransition(stable, millis(), &action))
      lightPtr->executeAction(action);
    else if (!stable)
      Serial.printf("=> No-motion timer started (%lums)\n", MOTION_NO_MOTION_TIMEOUT_MS);
  }

  LightAction action;
  if (automation.tick(millis(), &action))
    lightPtr->executeAction(action);
}

void light_motion_manual(LightAction action)
{
  lightPtr->executeAction(automation.handleManual(action == LightAction::LIGHT_ON));
}
