#ifndef LIGHT_H
#define LIGHT_H

#include <Arduino.h>
#include "core/mqtt_service.h"

// Device slot for the room light. Contract §2:
//   smarthome/cmd/light ON|OFF -> smarthome/state/light ON|OFF (retain)
// Hardware action is a TODO for the wiring phase (docs/pin-map.md).
class Light
{
public:
  void init(IMqtt &mqtt);
  void loop();
  void handleCommand(const char *payload, unsigned int length);

private:
  IMqtt *mqtt;
};

#endif // LIGHT_H
