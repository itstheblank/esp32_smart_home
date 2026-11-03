#ifndef LIGHT_LOGIC_H
#define LIGHT_LOGIC_H

#include <string.h>

// Pure logic — no Arduino.h, host-testable (docs/development.md)
enum class LightCommand
{
  ON,
  OFF,
  INVALID
};

inline LightCommand light_parse_command(const char *payload)
{
  if (payload == nullptr)
    return LightCommand::INVALID;
  if (strcmp(payload, "ON") == 0)
    return LightCommand::ON;
  if (strcmp(payload, "OFF") == 0)
    return LightCommand::OFF;
  return LightCommand::INVALID;
}

#endif // LIGHT_LOGIC_H
