#ifndef RFID_H
#define RFID_H

#include <Arduino.h>
#include <MFRC522.h>
#include "core/mqtt_service.h"

// RFID access device: polls the RC522, formats the UID with the pure
// rfid_format_uid/rfid_check_access helpers and publishes the contract access
// event. The automation/rfid_door rule consumes whitelisted events to open
// the door; this class never references other devices.
// Contract §2: smarthome/event/access JSON {"uid":"A1B2C3D4","result":"GRANTED"},
// max 128 bytes, no retain.
class Rfid
{
public:
  // One card read, waiting to be consumed by takeAccessEvent().
  // uid is uppercase hex (max 10 bytes = 20 chars + NUL); result points to
  // the contract constants RFID_RESULT_GRANTED / RFID_RESULT_DENIED.
  struct AccessEvent
  {
    char uid[21];
    const char *result;
  };

  void init(IMqtt &mqtt);
  void loop();
  bool publishAccess(const char *uid, const char *result);
  // Returns true exactly once per card read and copies the event out.
  bool takeAccessEvent(AccessEvent &out);

private:
  IMqtt *mqtt;
  MFRC522 reader;
  AccessEvent pending;
  bool eventPending;
};

#endif // RFID_H
