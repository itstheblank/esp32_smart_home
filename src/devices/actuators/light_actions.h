#ifndef LIGHT_ACTIONS_H
#define LIGHT_ACTIONS_H

#include <string.h>

// Pure logic — no Arduino.h, host-testable
enum class LightAction
{
  LIGHT_ON,
  LIGHT_OFF
};

// Payload parser for smarthome/cmd/light (contract §2: plain uppercase string).
// Returns false and leaves out untouched on invalid payloads.
inline bool light_action_from_payload(const char *payload, LightAction *out)
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
