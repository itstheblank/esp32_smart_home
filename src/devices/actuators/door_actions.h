#ifndef DOOR_ACTIONS_H
#define DOOR_ACTIONS_H

#include <stdint.h>
#include <string.h>

// Pure logic — no Arduino.h, host-testable
enum class DoorAction : uint8_t
{
  DOOR_OPEN,
  DOOR_CLOSE
};

// Maps a command payload to a DoorAction. Only exact "OPEN"/"CLOSE" (uppercase)
// are commands; state words like "CLOSED" are not.
inline bool door_action_from_string(const char *payload, DoorAction *out)
{
  if (payload == nullptr || out == nullptr)
    return false;
  if (strcmp(payload, "OPEN") == 0)
  {
    *out = DoorAction::DOOR_OPEN;
    return true;
  }
  if (strcmp(payload, "CLOSE") == 0)
  {
    *out = DoorAction::DOOR_CLOSE;
    return true;
  }
  return false;
}

// Maps a rule action byte to a DoorAction. Unknown codes are rejected.
inline bool door_action_from_code(uint8_t code, DoorAction *out)
{
  if (out == nullptr || code > static_cast<uint8_t>(DoorAction::DOOR_CLOSE))
    return false;
  *out = static_cast<DoorAction>(code);
  return true;
}

#endif // DOOR_ACTIONS_H
