#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "core/mqtt_service.h"
#include "door_logic.h"

// Door device: servo actuation + MQTT OPEN/CLOSE command handling.
// State is published inside open()/close(), so any caller (app command,
// RFID grant) produces a consistent retained state.
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
};

#endif // DOOR_H
