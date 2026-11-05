#ifndef STATE_SYNC_H
#define STATE_SYNC_H

// Pure logic — no Arduino.h, host-testable (docs/development.md)
// Tracks whether a device's retained state still has to reach the broker.
// mark() on every state change; shouldPublish(connected) fires exactly once
// once a connection exists. Covers initial state after boot, transitions
// that happened while offline, and state after an MQTT reconnect.
class StateSync
{
public:
  void mark() { dirty = true; }

  bool shouldPublish(bool connected)
  {
    if (!dirty || !connected)
      return false;
    dirty = false;
    return true;
  }

private:
  bool dirty = false;
};

#endif // STATE_SYNC_H
