#ifndef DOOR_H
#define DOOR_H

#include <Arduino.h>
#include <ESP32Servo.h>

class Door
{
public:
  void init();
  void open();
  void close();

private:
  Servo servo;
};

#endif // DOOR_H
