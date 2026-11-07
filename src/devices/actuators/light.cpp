#include "light.h"
#include "core/log_service.h"
#include <Arduino.h>

void Light::init(uint8_t deviceId, uint8_t outputPin)
{
  id = deviceId;
  pin = outputPin;
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  state = false;
  LogService::instance().logAction("LIGHT", id, "OFF", true);
}

bool Light::executeAction(LightAction action)
{
  state = (action == LightAction::LIGHT_ON);
  digitalWrite(pin, state ? HIGH : LOW);
  Serial.printf("=> Light (id=%u, pin=%u) -> %s\n", id, pin, state ? "ON" : "OFF");
  LogService::instance().logAction("LIGHT", id, state ? "ON" : "OFF", true);
  return true;
}
