#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "core/mqtt_service.h"
#include "door_actions.h"
#include <devices/device_types.h>

class Door
{
public:
  void init(uint8_t id, MqttService &mqtt, uint8_t pin);
  void executeAction(DoorAction action);

private:
  DeviceType type = DeviceType::DOOR;
  uint8_t id;
  Servo servo;
  MqttService *mqtt;
  uint8_t pin;
  bool isOpen;
};

#endif // DOOR_H
