#ifndef LIGHT_H
#define LIGHT_H

#include "core/mqtt_service.h"
#include "light_actions.h"
#include <devices/device_types.h>

class Light
{
public:
  void init(uint8_t id, MqttService &mqtt, uint8_t pin);
  void executeAction(LightAction action);

private:
  DeviceType type = DeviceType::LIGHT;
  uint8_t id;
  MqttService *mqtt;
  uint8_t pin;
};

#endif // LIGHT_H
