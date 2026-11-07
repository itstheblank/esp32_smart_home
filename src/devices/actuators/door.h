#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "door_actions.h"
#include <devices/device_types.h>

class Door
{
public:
  void init(uint8_t id, uint8_t pin);
  bool executeAction(DoorAction action);
  bool isDoorOpen() const { return isOpen; }
  uint8_t getId() const { return id; }

private:
  DeviceType type = DeviceType::DOOR;
  uint8_t id = 0;
  uint8_t pin = 0;
  Servo servo;
  bool isOpen = false;
};

#endif // DOOR_H
