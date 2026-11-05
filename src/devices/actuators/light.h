#ifndef LIGHT_H
#define LIGHT_H

#include <Arduino.h>
#include "config.h"
#include "core/mqtt_service.h"
#include "light_automation.h"
#include "light_command_mapper.h"

// Light device: drives its output pin and honors manual MQTT commands. The
// automation state machine (motion -> ON, no-motion timeout -> OFF, manual
// override) is fed by the automation/light_motion rule via
// handleMotionTransition(); this class never references other devices.
class Light
{
public:
  void init(IMqtt &mqtt, uint8_t pin);
  void handleCommand(const char *payload, unsigned int length);
  void handleMotionTransition(bool detected);
  void loop();

private:
  void apply(LightAction action, const char *source);

  IMqtt *mqtt;
  LightAutomation automation{MOTION_NO_MOTION_TIMEOUT_MS};
  uint8_t pin;
};

#endif // LIGHT_H
