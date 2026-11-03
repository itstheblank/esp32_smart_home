#ifndef MOTION_LOGIC_H
#define MOTION_LOGIC_H

// Pure logic — no Arduino.h, host-testable (docs/development.md)
inline bool motion_is_rising(bool previousActive, bool currentActive)
{
  return currentActive && !previousActive;
}

#endif // MOTION_LOGIC_H
