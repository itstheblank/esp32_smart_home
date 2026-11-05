#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "core/mqtt_service.h"
#include "door_logic.h"
#include "state_sync.h"

// Door device: servo actuation + MQTT OPEN/CLOSE command handling.
// State (open/closed) is tracked and published through StateSync, so the
// initial state reaches the broker right after the first connect and stays
// correct across reconnects — regardless of who moved the door (app command,
// RFID grant).
class Door
{
public:
  void init(IMqtt &mqtt);
  void handleCommand(const char *payload, unsigned int length);
  void loop();
  void open();
  void close();

private:
  Servo servo;
  IMqtt *mqtt;
  bool isOpen;
  StateSync state;
};

#endif // DOOR_H
