#ifndef DOOR_ACTIONS_H
#define DOOR_ACTIONS_H

#include <string.h>

// Pure logic — no Arduino.h, host-testable
enum class DoorAction
{
  DOOR_OPEN,
  DOOR_CLOSE
};

// Payload parser for smarthome/cmd/door (contract §2: command is `CLOSE`,
// the matching state is `CLOSED`). Returns false and leaves out untouched
// on invalid payloads.
inline bool door_action_from_payload(const char *payload, DoorAction *out)
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

#endif // DOOR_ACTIONS_H
