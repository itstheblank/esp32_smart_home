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

#endif // DOOR_ACTIONS_H
