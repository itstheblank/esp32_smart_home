#ifndef MOTION_DOOR_H
#define MOTION_DOOR_H

#include "core/mqtt_service.h"
#include "devices/door.h"
#include "devices/motion.h"

void motion_door_setup(Motion &motion, Door &door, IMqtt &mqtt);
void motion_door_loop();

#endif // MOTION_DOOR_H
