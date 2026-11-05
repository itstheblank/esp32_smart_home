#ifndef LIGHT_H
#define LIGHT_H

#include <Arduino.h>
#include "automation/light_automation.h"
#include "config.h"
#include "core/mqtt_service.h"
#include "light_logic.h"

class Motion;

// Light device: drives its output pin, honors manual MQTT commands and runs
// the PIR-driven automation (motion -> ON, no-motion timeout -> OFF).
class Light
{
public:
  void init(IMqtt &mqtt, uint8_t pin);
  void attachMotion(const Motion *motionSource);
  void handleCommand(const char *payload, unsigned int length);
  void loop();

private:
  void apply(LightAction action, const char *source);

  IMqtt *mqtt;
  const Motion *motion;
  LightAutomation automation{MOTION_NO_MOTION_TIMEOUT_MS};
  uint8_t pin;
  bool lastStable;
};

#endif // LIGHT_H
