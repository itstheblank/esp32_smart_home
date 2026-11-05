#include "rfid_door.h"
#include "devices/actuators/door.h"
#include "devices/sensors/rfid.h"
#include "devices/sensors/rfid_output_access.h"
#include <string.h>

static Rfid *rfidPtr = nullptr;
static Door *doorPtr = nullptr;

void rfid_door_setup(Rfid &rfid, Door &door)
{
  rfidPtr = &rfid;
  doorPtr = &door;
}

void rfid_door_loop()
{
  Rfid::AccessEvent event;
  if (rfidPtr->takeAccessEvent(event) &&
      strcmp(event.result, RFID_RESULT_GRANTED) == 0)
  {
    doorPtr->open();
  }
}
