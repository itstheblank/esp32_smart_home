#include "light.h"
#include "config.h"
#include "devices/light_logic.h"

void Light::init(IMqtt &m)
{
  mqtt = &m;
}

void Light::loop()
{
  // Nothing to poll yet; kept for the device interface (docs/architecture.md §3.2)
}

void Light::handleCommand(const char *payload, unsigned int)
{
  switch (light_parse_command(payload))
  {
  case LightCommand::ON:
    // TODO(Member 3): drive relay/LED pin once wired (docs/pin-map.md)
    mqtt->publishState(TOPIC_STATE_LIGHT, "ON");
    Serial.println("=> Published: ON");
    break;
  case LightCommand::OFF:
    // TODO(Member 3): drive relay/LED pin once wired (docs/pin-map.md)
    mqtt->publishState(TOPIC_STATE_LIGHT, "OFF");
    Serial.println("=> Published: OFF");
    break;
  default:
    Serial.println("=> ERROR: Invalid light command, ignored!");
    break;
  }
}
