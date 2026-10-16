#include <Arduino.h>
#include "actuator_bridge.h"

namespace actuator
{
bool setLight(bool on)
{
  Serial.printf("[ACTUATOR STUB] light -> %s (replace with Member 3 implementation)\n", on ? "ON" : "OFF");
  return true;
}

bool openDoor()
{
  Serial.println("[ACTUATOR STUB] door -> OPEN (replace with Member 3 implementation)");
  return true;
}

bool closeDoor()
{
  Serial.println("[ACTUATOR STUB] door -> CLOSED (replace with Member 3 implementation)");
  return true;
}
} // namespace actuator
