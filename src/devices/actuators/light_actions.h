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

// Maps a rule action byte to a LightAction. Unknown codes are rejected.
inline bool light_action_from_code(uint8_t code, LightAction *out)
{
  if (out == nullptr || code > static_cast<uint8_t>(LightAction::LIGHT_OFF))
    return false;
  *out = static_cast<LightAction>(code);
  return true;
}

#endif // LIGHT_ACTIONS_H
