#ifndef RULE_ENGINE_H
#define RULE_ENGINE_H

#include <stdint.h>
#include "rule.h"
#include "device_action.h"

// Pure logic — no Arduino.h, host-testable

// Collects the actions of every rule whose trigger matches the event.
// Returns the number of actions written to outActions (0 when nothing matches).
inline uint8_t rule_engine_dispatch(const Rule *rules, 
                                    uint8_t ruleCount,
                                    const DeviceEvent &event,
                                    RuleAction *outActions, 
                                    uint8_t outCap)
{
  uint8_t count = 0;
  if (rules == nullptr || outActions == nullptr)
    return 0;
  const uint8_t eventDeviceType = static_cast<uint8_t>(event.deviceType);

  for (uint8_t i = 0; i < ruleCount; i++)
  {
    const Rule &rule = rules[i];
    if (rule.trigger.deviceType != eventDeviceType ||
        rule.trigger.deviceId != event.deviceId ||
        rule.trigger.deviceEvent != event.deviceEvent)
      continue;

    for (uint8_t a = 0; a < rule.actionCount && a < RULE_MAX_ACTIONS && count < outCap; a++)
      outActions[count++] = rule.actions[a];
  }
  return count;
}

#endif // RULE_ENGINE_H
