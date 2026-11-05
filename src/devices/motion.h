#ifndef MOTION_H
#define MOTION_H

#include <Arduino.h>
#include "config.h"
#include "core/mqtt_service.h"
#include "motion_logic.h"
#include "state_sync.h"

// PIR device. Publishes retained DETECTED/CLEAR on stable (debounced)
// transitions; exposes the stable state for the automation/light_motion rule.
class Motion
{
public:
  void init(IMqtt &mqtt);
  void loop();
  bool stableMotion() const { return logic.stableState(); }

private:
  IMqtt *mqtt;
  MotionDebounceLogic logic{PIR_STABLE_MS};
  StateSync state;
};

#endif // MOTION_H
