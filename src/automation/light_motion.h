#ifndef LIGHT_MOTION_H
#define LIGHT_MOTION_H

class Motion;
class Light;

// Automation rule (architecture.md §1 rule 2): couples the PIR device to the
// light device. Feeds stable PIR transitions into the light's automation
// state machine (motion -> ON, no-motion timeout -> OFF, manual override).
void light_motion_setup(Motion &motion, Light &light);
void light_motion_loop();

#endif // LIGHT_MOTION_H
