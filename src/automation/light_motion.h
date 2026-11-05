#ifndef LIGHT_MOTION_H
#define LIGHT_MOTION_H

#include "devices/actuators/light_actions.h"

class Motion;
class Light;

// Automation rule (architecture.md §1 rule 2): couples the PIR device to the
// light device and owns the light state machine — stable motion -> ON,
// no-motion timeout -> OFF, manual MQTT commands take priority until the next
// stable PIR transition (docs/contracts/rule-contract.md rule 1 + manual path).
void light_motion_setup(Motion &motion, Light &light);
void light_motion_loop();
void light_motion_manual(LightAction action);

#endif // LIGHT_MOTION_H
