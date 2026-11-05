#ifndef RULE_MODEL_H
#define RULE_MODEL_H

#include <stddef.h>
#include <stdint.h>

// C++ model of docs/contracts/rule-contract.md — pure, no Arduino.h, host-testable.
// A rule is data: {id, name, description, enabled, trigger → actions[]}.

// Static caps (contract §4) — no dynamic allocation on the ESP32
const uint8_t RULE_MAX_RULES = 8;
const uint8_t RULE_MAX_ACTIONS = 2;

// Trigger types (contract §3)
enum class RuleTriggerType : uint8_t
{
  changedTo,   // once per state transition into value; boot initial publish is not a transition
  isForMs,     // continuous hold of value for stableMs; resets when the state leaves value
  eventEquals, // event occurrence whose field equals value; no replay
};

// Trigger devices = source devices (contract §1)
enum class RuleSource : uint8_t
{
  motion,
  rfid,
};

// Event fields addressable by eventEquals
enum class RuleEventField : uint8_t
{
  result, // "result" in smarthome/event/access
};

// Trigger value vocabulary — the meaning depends on the source device
enum class RuleTriggerValue : uint8_t
{
  detected, // motion state DETECTED
  clear,    // motion state CLEAR
  granted,  // rfid event result GRANTED
  denied,   // rfid event result DENIED
};

// Action devices = sink devices (contract §1)
enum class RuleSink : uint8_t
{
  light,
  door,
};

// Action command vocabulary — commands, not states (contract §2: CLOSE, never CLOSED)
enum class RuleCommand : uint8_t
{
  on,
  off,
  open,
  close,
};

struct RuleTrigger
{
  RuleTriggerType type;
  RuleSource device;
  RuleEventField field;   // eventEquals only
  RuleTriggerValue value;
  unsigned long stableMs; // isForMs only
};

struct RuleAction
{
  RuleSink device;
  RuleCommand command;
};

struct Rule
{
  uint8_t id; // incremental, assigned in declaration order (1, 2, 3, ...)
  const char *name;
  const char *description;
  bool enabled;
  RuleTrigger trigger;
  RuleAction actions[RULE_MAX_ACTIONS];
  uint8_t actionCount;
  bool protectedRule; // protected rules cannot be disabled or overridden dynamically
};

// --- Validation helpers (pure) ---

// A trigger value is only legal for its own source device.
inline bool rule_source_allows_value(RuleSource source, RuleTriggerValue value)
{
  switch (source)
  {
  case RuleSource::motion:
    return value == RuleTriggerValue::detected || value == RuleTriggerValue::clear;
  case RuleSource::rfid:
    return value == RuleTriggerValue::granted || value == RuleTriggerValue::denied;
  }
  return false;
}

// A sink only accepts its own command vocabulary.
inline bool rule_sink_allows_command(RuleSink sink, RuleCommand command)
{
  switch (sink)
  {
  case RuleSink::light:
    return command == RuleCommand::on || command == RuleCommand::off;
  case RuleSink::door:
    return command == RuleCommand::open || command == RuleCommand::close;
  }
  return false;
}

// door ← OPEN is the whitelist-protected action: only allowed in protected rules.
inline bool rule_is_protected_action(const RuleAction &action)
{
  return action.device == RuleSink::door && action.command == RuleCommand::open;
}

// Full structural validation per the contract.
inline bool rule_valid(const Rule &rule)
{
  if (rule.actionCount == 0 || rule.actionCount > RULE_MAX_ACTIONS)
    return false;
  if (!rule_source_allows_value(rule.trigger.device, rule.trigger.value))
    return false;
  if (rule.trigger.type == RuleTriggerType::isForMs && rule.trigger.stableMs == 0)
    return false;
  for (uint8_t i = 0; i < rule.actionCount; i++)
  {
    if (!rule_sink_allows_command(rule.actions[i].device, rule.actions[i].command))
      return false;
    if (rule_is_protected_action(rule.actions[i]) && !rule.protectedRule)
      return false; // dynamic rules must not open the door
  }
  return true;
}

#endif // RULE_MODEL_H
