#ifndef MOTION_DOOR_LOGIC_H
#define MOTION_DOOR_LOGIC_H

// Pure state machine — no Arduino.h, host-testable (docs/development.md)
// Rule M2-09: PIR rising edge -> open door, auto close after 2s.
// Outputs are applied by the caller in fixed order:
//   motionDetected -> publish motion state
//   doorOpen       -> open door, publish OPEN
//   doorClose      -> publish CLOSED, close door
enum class MotionDoorState
{
  IDLE,
  WAITING_AUTO_CLOSE
};

struct MotionDoorOutputs
{
  bool motionDetected;
  bool doorOpen;
  bool doorClose;
};

class MotionDoorLogic
{
public:
  MotionDoorLogic() : state(MotionDoorState::IDLE), waitStart(0) {}

  void reset()
  {
    state = MotionDoorState::IDLE;
    waitStart = 0;
  }

  bool idle() const { return state == MotionDoorState::IDLE; }

  MotionDoorOutputs step(bool motionEdge, unsigned long nowMs)
  {
    MotionDoorOutputs out = {};
    if (state == MotionDoorState::IDLE)
    {
      if (motionEdge)
      {
        out.motionDetected = true;
        out.doorOpen = true;
        waitStart = nowMs;
        state = MotionDoorState::WAITING_AUTO_CLOSE;
      }
    }
    else if (nowMs - waitStart >= AUTO_CLOSE_MS)
    {
      out.doorClose = true;
      state = MotionDoorState::IDLE;
    }
    return out;
  }

private:
  static const unsigned long AUTO_CLOSE_MS = 2000;
  MotionDoorState state;
  unsigned long waitStart;
};

#endif // MOTION_DOOR_LOGIC_H
