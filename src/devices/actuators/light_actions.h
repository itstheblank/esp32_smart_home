#ifndef LIGHT_ACTIONS_H
#define LIGHT_ACTIONS_H

#include <stdint.h>
#include <string.h>

// Pure logic — no Arduino.h, host-testable
enum class LightAction : uint8_t
{
  LIGHT_ON,
  LIGHT_OFF
};

#endif // LIGHT_ACTIONS_H
