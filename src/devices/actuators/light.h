#ifndef LIGHT_H
#define LIGHT_H

#include <stdint.h>
#include "light_actions.h"
#include <devices/device_types.h>

class Light
{
public:
  void init(uint8_t id, uint8_t pin);
  bool executeAction(LightAction action);
  bool isOn() const { return state; }
  uint8_t getId() const { return id; }

private:
  DeviceType type = DeviceType::LIGHT;
  uint8_t id = 0;
  uint8_t pin = 0;
  bool state = false;
};

#endif // LIGHT_H
