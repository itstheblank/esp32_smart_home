#ifndef MOTION_LOGIC_H
#define MOTION_LOGIC_H

inline bool motion_is_rising(bool previousActive, bool currentActive)
{
  return currentActive && !previousActive;
}

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
