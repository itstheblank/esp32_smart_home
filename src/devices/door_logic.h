#ifndef DOOR_LOGIC_H
#define DOOR_LOGIC_H

#include <string.h>

// Pure logic — no Arduino.h, host-testable (docs/development.md)
enum class DoorCommand
{
  OPEN,
  CLOSE,
  INVALID
};

inline DoorCommand door_parse_command(const char *payload)
{
  if (payload == nullptr)
    return DoorCommand::INVALID;
  if (strcmp(payload, "OPEN") == 0)
    return DoorCommand::OPEN;
  if (strcmp(payload, "CLOSE") == 0)
    return DoorCommand::CLOSE;
  return DoorCommand::INVALID;
}

#endif // DOOR_LOGIC_H
