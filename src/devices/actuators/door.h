#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "core/mqtt_service.h"
#include "door_command_mapper.h"

// Door device: servo actuation + MQTT OPEN/CLOSE command handling.
class Door
{
public:
  void init(IMqtt &mqtt);
  void handleCommand(const char *payload, unsigned int length);
  void open();
  void close();

private:
  Servo servo;
  IMqtt *mqtt;
  bool isOpen;
};

#endif // DOOR_H
