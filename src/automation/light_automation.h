#ifndef LIGHT_AUTOMATION_H
#define LIGHT_AUTOMATION_H

// Pure logic — no Arduino.h, host-testable (docs/development.md)
// Ported from member2's sensors-automation rules:
//   - stable PIR transition -> DETECTED turns the light on, CLEAR starts the
//     no-motion timer; expiry turns the light off.
//   - a manual MQTT command applies immediately, cancels the pending timer and
//     takes priority until the NEXT stable PIR transition (deterministic
//     manual-vs-automation priority without an extra mode topic).
enum class LightAction
{
  NONE,
  ON,
  OFF
};

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

  LightAction handleStableTransition(bool detected, unsigned long nowMs)
  {
    // A new physical PIR transition explicitly returns control to automation.
    manualOverride = false;
    if (detected)
    {
      waitingForNoMotion = false;
      return apply(true);
    }
    waitingForNoMotion = true;
    noMotionStartedAt = nowMs;
    return LightAction::NONE;
  }

  LightAction tick(unsigned long nowMs)
  {
    if (waitingForNoMotion && nowMs - noMotionStartedAt >= noMotionTimeoutMs)
    {
      waitingForNoMotion = false;
      if (!manualOverride)
        return apply(false);
    }
    return LightAction::NONE;
  }

  bool isOn() const { return lightOn; }
  bool isManualOverride() const { return manualOverride; }

private:
  LightAction apply(bool on)
  {
    lightOn = on;
    return on ? LightAction::ON : LightAction::OFF;
  }

  unsigned long noMotionTimeoutMs;
  bool lightOn;
  bool manualOverride;
  bool waitingForNoMotion;
  unsigned long noMotionStartedAt;
};

#endif // LIGHT_AUTOMATION_H
