#include "light.h"
#include "config.h"

void Light::init(IMqtt &m, uint8_t outputPin, uint8_t deviceId)
{
  mqtt = &m;
  pin = outputPin;
  id = deviceId;
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  mqtt->publishState(TOPIC_STATE_LIGHT, "OFF");
}

void Light::executeAction(LightAction action)
{
  const bool on = (action == LightAction::LIGHT_ON);
  digitalWrite(pin, on ? HIGH : LOW);
  if (mqtt && mqtt->connected())
  {
    mqtt->publishState(TOPIC_STATE_LIGHT, on ? "ON" : "OFF");
    Serial.printf("=> Published: %s\n", on ? "ON" : "OFF");
  }
  Serial.printf("=> Light state -> %s\n", on ? "ON" : "OFF");
}
