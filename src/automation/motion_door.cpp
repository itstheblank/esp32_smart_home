#include "motion_door.h"
#include "motion_door_logic.h"
#include "config.h"

static Motion *motionPtr = nullptr;
static Door *doorPtr = nullptr;
static IMqtt *mqttPtr = nullptr;
static MotionDoorLogic logic;

void motion_door_setup(Motion &motion, Door &door, IMqtt &mqtt)
{
  motionPtr = &motion;
  doorPtr = &door;
  mqttPtr = &mqtt;
  logic.reset();
}

// PIR rising edge -> open door, auto close after 2s (non-blocking, millis-based)
void motion_door_loop()
{
  // Poll the PIR only while idle — same as the previous if/else structure
  bool motionEdge = false;
  if (logic.idle())
  {
    motionEdge = motionPtr->loop();
  }

  MotionDoorOutputs out = logic.step(motionEdge, millis());

  if (out.motionDetected)
  {
    Serial.println("=> Motion DETECTED on IO39!");

    // 1. Send message: DETECTED
    if (mqttPtr->connected())
    {
      mqttPtr->publishState(TOPIC_STATE_MOTION, "DETECTED");
      Serial.println("=> Published: DETECTED");
    }
  }

  if (out.doorOpen)
  {
    // 2. Open the door
    doorPtr->open();
    if (mqttPtr->connected())
    {
      mqttPtr->publishState(TOPIC_STATE_DOOR, "OPEN");
      Serial.println("=> Published: OPEN");
    }
  }

  if (out.doorClose)
  {
    // 4. Send message: CLOSED
    if (mqttPtr->connected())
    {
      mqttPtr->publishState(TOPIC_STATE_DOOR, "CLOSED");
      Serial.println("=> Published: CLOSED");
    }

    // 5. Close the door
    doorPtr->close();
  }
}
