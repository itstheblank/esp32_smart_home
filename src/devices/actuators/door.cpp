#include "door.h"
#include "core/log_service.h"
#include <Arduino.h>

void Door::init(uint8_t deviceId, uint8_t servoPin)
{
  id = deviceId;
  pin = servoPin;
  // Setup SG90 Servo on pin (see config / docs/pin-map.md §1)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  servo.setPeriodHertz(50);             // Standard 50Hz servo
  servo.attach(pin, 500, 2400);         // Standard 500us to 2400us range for SG90
  executeAction(DoorAction::DOOR_CLOSE); // Initial state: Closed (0 degrees)
}

bool Door::executeAction(DoorAction action)
{
  isOpen = (action == DoorAction::DOOR_OPEN);
  servo.write(isOpen ? 180 : 0);
  Serial.printf("=> Door (id=%u, pin=%u) -> %s (%d degrees)\n", id, pin, isOpen ? "OPEN" : "CLOSE", isOpen ? 180 : 0);
  LogService::instance().logAction("DOOR", id, isOpen ? "OPEN" : "CLOSE", true);
  return true;
}
