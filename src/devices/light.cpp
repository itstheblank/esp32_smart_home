#include "light.h"
#include "config.h"
#include "motion.h"

void Light::init(IMqtt &m, uint8_t outputPin)
{
  mqtt = &m;
  pin = outputPin;
  motion = nullptr;
  lastStable = false;
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void Light::attachMotion(const Motion *motionSource)
{
  motion = motionSource;
  if (motion != nullptr)
    lastStable = motion->stableMotion();
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

void Light::loop()
{
  if (motion != nullptr)
  {
    const bool stable = motion->stableMotion();
    if (stable != lastStable)
    {
      lastStable = stable;
      apply(automation.handleStableTransition(stable, millis()),
            stable ? "motion detected" : "no-motion timer started");
    }
  }
  apply(automation.tick(millis()), "no-motion timeout");
}

void Light::apply(LightAction action, const char *source)
{
  if (action == LightAction::NONE)
    return;
  const bool on = action == LightAction::ON;
  digitalWrite(pin, on ? HIGH : LOW);
  mqtt->publishState(TOPIC_STATE_LIGHT, on ? "ON" : "OFF");
  Serial.printf("=> Light state -> %s (%s)\n", on ? "ON" : "OFF", source);
}
