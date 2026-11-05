#ifndef LIGHT_AUTOMATION_H
#define LIGHT_AUTOMATION_H

#include "light_actions.h"

// Pure logic — no Arduino.h, host-testable (docs/development.md)
// Ported from member2's sensors-automation rules:
//   - stable PIR transition -> DETECTED turns the light on, CLEAR starts the
//     no-motion timer; expiry turns the light off.
//   - a manual MQTT command applies immediately, cancels the pending timer and
//     takes priority until the NEXT stable PIR transition (deterministic
//     manual-vs-automation priority without an extra mode topic).

class LightAutomation
{
public:
  explicit LightAutomation(unsigned long noMotionTimeoutMs)
      : noMotionTimeoutMs(noMotionTimeoutMs), lightOn(false),
        manualOverride(false), waitingForNoMotion(false), noMotionStartedAt(0) {}

  LightAction handleManual(bool on)
  {
    manualOverride = true;
    waitingForNoMotion = false;
    return apply(on);
  }

  bool handleStableTransition(bool detected, unsigned long nowMs, LightAction *action = nullptr)
  {
    // A new physical PIR transition explicitly returns control to automation.
    manualOverride = false;
    if (detected)
    {
      waitingForNoMotion = false;
      const LightAction act = apply(true);
      if (action != nullptr)
        *action = act;
      return true;
    }
    waitingForNoMotion = true;
    noMotionStartedAt = nowMs;
    return false;
  }

  bool tick(unsigned long nowMs, LightAction *action = nullptr)
  {
    if (waitingForNoMotion && nowMs - noMotionStartedAt >= noMotionTimeoutMs)
    {
      waitingForNoMotion = false;
      if (!manualOverride)
      {
        const LightAction act = apply(false);
        if (action != nullptr)
          *action = act;
        return true;
      }
    }
    return false;
  }

  bool isOn() const { return lightOn; }
  bool isManualOverride() const { return manualOverride; }

private:
  LightAction apply(bool on)
  {
    lightOn = on;
    return on ? LightAction::LIGHT_ON : LightAction::LIGHT_OFF;
  }

  unsigned long noMotionTimeoutMs;
  bool lightOn;
  bool manualOverride;
  bool waitingForNoMotion;
  unsigned long noMotionStartedAt;
};

#endif // LIGHT_AUTOMATION_H
