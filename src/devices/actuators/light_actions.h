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

// Maps a command payload to a LightAction. Only exact "ON"/"OFF" (uppercase,
// no whitespace or quotes) are accepted.
inline bool light_action_from_string(const char *payload, LightAction *out)
{
  if (payload == nullptr || out == nullptr)
    return false;
  if (strcmp(payload, "ON") == 0)
  {
    *out = LightAction::LIGHT_ON;
    return true;
  }
  if (strcmp(payload, "OFF") == 0)
  {
    *out = LightAction::LIGHT_OFF;
    return true;
  }
  return false;
}

#endif // LIGHT_ACTIONS_H
