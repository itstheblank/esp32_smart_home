#ifndef RULE_MODEL_H
#define RULE_MODEL_H

#include <stdint.h>

const uint8_t RULE_MAX_RULES = 8;
const uint8_t RULE_MAX_ACTIONS = 2;

struct RuleTrigger
{
  uint8_t deviceType;
  uint8_t deviceId;
  uint8_t deviceEvent; 
};

struct RuleAction
{
  uint8_t deviceType;
  uint8_t deviceId;
  uint8_t deviceAction;
  uint8_t deviceActionParam;
};

struct Rule
{
  uint8_t id;
  RuleTrigger trigger;
  RuleAction actions[RULE_MAX_ACTIONS];
  uint8_t actionCount;
};

#endif // RULE_MODEL_H
