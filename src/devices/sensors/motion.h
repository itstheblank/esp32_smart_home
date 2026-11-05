#ifndef MOTION_H
#define MOTION_H

#include "config.h"
#include "core/mqtt_service.h"
#include "motion_output_debounce.h"

class Motion
{
public:
  void init(IMqtt &mqtt);
  void loop();
  bool stableMotion() const { return logic.stableState(); }

private:
  IMqtt *mqtt;
  MotionDebounceLogic logic{PIR_STABLE_MS};
};

#endif // MOTION_H
