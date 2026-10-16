#ifndef ACTUATOR_BRIDGE_H
#define ACTUATOR_BRIDGE_H

// Temporary integration boundary for Member 3's LED/relay/servo code.
// The default implementation only logs and reports success, so Member 2 can
// compile and exercise MQTT/sensor flows before real actuator code arrives.
// Member 3 should replace the bodies in actuator_bridge.cpp, keeping this API.
namespace actuator
{
bool setLight(bool on);
bool openDoor();
bool closeDoor();
} // namespace actuator

#endif
