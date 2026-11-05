#ifndef MOTION_LOGIC_H
#define MOTION_LOGIC_H

#include <stddef.h>

// Pure logic — no Arduino.h, host-testable (docs/development.md)
inline bool motion_is_rising(bool previousActive, bool currentActive)
{
  return currentActive && !previousActive;
}

// Pure PIR debounce (member2 rule): a raw level must hold for stableMs before
// it is accepted as the stable state. step() returns true exactly once per
// accepted stable transition and reports the new stable state.
class MotionDebounceLogic
{
public:
  explicit MotionDebounceLogic(unsigned long stableMs)
      : stableMs(stableMs), stable(false), raw(false), rawChangedAt(0) {}

  void reset(bool initialRaw, unsigned long nowMs)
  {
    raw = initialRaw;
    stable = initialRaw;
    rawChangedAt = nowMs;
  }

  bool step(bool sample, unsigned long nowMs, bool *newStable = nullptr)
  {
    if (sample != raw)
    {
      raw = sample;
      rawChangedAt = nowMs;
    }
    if (raw != stable && nowMs - rawChangedAt >= stableMs)
    {
      stable = raw;
      if (newStable != nullptr)
        *newStable = stable;
      return true;
    }
    return false;
  }

  bool stableState() const { return stable; }

private:
  unsigned long stableMs;
  bool stable;
  bool raw;
  unsigned long rawChangedAt;
};

#endif // MOTION_LOGIC_H
