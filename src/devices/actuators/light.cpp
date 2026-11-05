#include "light.h"
#include "config.h"

void Light::init(IMqtt &m, uint8_t outputPin)
{
  mqtt = &m;
  pin = outputPin;
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void Light::handleCommand(const char *payload, unsigned int)
{
  switch (light_parse_command(payload))
  {
  case LightCommand::ON:
    apply(automation.handleManual(true), "manual MQTT command");
    break;
  case LightCommand::OFF:
    apply(automation.handleManual(false), "manual MQTT command");
    break;
  default:
    Serial.println("=> ERROR: Invalid light command, ignored!");
    break;
  }
}

void Light::handleMotionTransition(bool detected)
{
  if (!detected)
  {
    Serial.printf("=> No-motion timer started (%lums)\n", MOTION_NO_MOTION_TIMEOUT_MS);
  }
  apply(automation.handleStableTransition(detected, millis()),
        detected ? "motion detected" : "no-motion timeout pending");
}

void Light::loop()
{
  apply(automation.tick(millis()), "no-motion timeout");
}

void Light::apply(LightAction action, const char *source)
{
  if (action == LightAction::NONE)
    return;
  const bool on = action == LightAction::ON;
  digitalWrite(pin, on ? HIGH : LOW);
  if (mqtt->connected())
  {
    mqtt->publishState(TOPIC_STATE_LIGHT, on ? "ON" : "OFF");
    Serial.printf("=> Published: %s\n", on ? "ON" : "OFF");
  }
  Serial.printf("=> Light state -> %s (%s)\n", on ? "ON" : "OFF", source);
}
