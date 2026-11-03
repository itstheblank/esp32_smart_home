#include "motion_door.h"
#include "config.h"

static const unsigned long DOOR_AUTO_CLOSE_MS = 2000;

static Motion *motionPtr = nullptr;
static Door *doorPtr = nullptr;
static IMqtt *mqttPtr = nullptr;
static bool waitingAutoClose = false;
static unsigned long waitStart = 0;

void motion_door_setup(Motion &motion, Door &door, IMqtt &mqtt)
{
  motionPtr = &motion;
  doorPtr = &door;
  mqttPtr = &mqtt;
}

// PIR rising edge -> open door, auto close after 2s (non-blocking, millis-based)
void motion_door_loop()
{
  if (!waitingAutoClose)
  {
    if (motionPtr->loop())
    {
      Serial.println("=> Motion DETECTED on IO39!");

      // 1. Send message: DETECTED
      if (mqttPtr->connected())
      {
        mqttPtr->publishState(TOPIC_STATE_MOTION, "DETECTED");
        Serial.println("=> Published: DETECTED");
      }

      // 2. Open the door
      doorPtr->open();
      if (mqttPtr->connected())
      {
        mqttPtr->publishState(TOPIC_STATE_DOOR, "OPEN");
        Serial.println("=> Published: OPEN");
      }

      waitStart = millis();
      waitingAutoClose = true;
    }
  }
  else if (millis() - waitStart >= DOOR_AUTO_CLOSE_MS)
  {
    // 4. Send message: CLOSED
    if (mqttPtr->connected())
    {
      mqttPtr->publishState(TOPIC_STATE_DOOR, "CLOSED");
      Serial.println("=> Published: CLOSED");
    }

    // 5. Close the door
    doorPtr->close();
    waitingAutoClose = false;
  }
}
