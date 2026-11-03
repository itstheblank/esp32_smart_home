#ifndef RFID_H
#define RFID_H

#include <Arduino.h>
#include "core/mqtt_service.h"

// Device slot for the RFID reader. Contract §2:
//   smarthome/event/access  JSON {"uid":"A1B2C3D4","result":"GRANTED"}
//   max 128 bytes, no retain.
// Card reading is a TODO for Member 2; the publish path is ready.
class Rfid
{
public:
  void init(IMqtt &mqtt);
  void loop();
  bool publishAccess(const char *uid, const char *result);

private:
  IMqtt *mqtt;
};

#endif // RFID_H
