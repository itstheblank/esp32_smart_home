#ifndef RFID_H
#define RFID_H

#include <Arduino.h>
#include <MFRC522.h>
#include "core/mqtt_service.h"

// RFID access device (member2 feature): polls the RC522, formats the UID with
// the pure rfid_format_uid/rfid_check_access helpers, publishes the
// contract access event and opens the door on a whitelisted UID.
// Contract §2: smarthome/event/access JSON {"uid":"A1B2C3D4","result":"GRANTED"},
// max 128 bytes, no retain.
class Door;

class Rfid
{
public:
  void init(IMqtt &mqtt, Door &door);
  void loop();
  bool publishAccess(const char *uid, const char *result);

private:
  IMqtt *mqtt;
  Door *door;
  MFRC522 reader;
};

#endif // RFID_H
