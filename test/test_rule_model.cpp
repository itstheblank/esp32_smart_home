#include <unity.h>
#include "automation/rule_model.h"

static Rule makeValidRule()
{
  Rule r = {};
  r.id = 1;
  r.name = "t";
  r.description = "t";
  r.enabled = true;
  r.trigger.type = RuleTriggerType::changedTo;
  r.trigger.device = RuleSource::motion;
  r.trigger.value = RuleTriggerValue::detected;
  r.actions[0] = {RuleSink::light, RuleCommand::on};
  r.actionCount = 1;
  return r;
}

static void test_valid_rule_passes(void)
{
  Rule r = makeValidRule();
  TEST_ASSERT_TRUE(rule_valid(r));
}

static void test_motion_source_rejects_rfid_values(void)
{
  TEST_ASSERT_TRUE(rule_source_allows_value(RuleSource::motion, RuleTriggerValue::detected));
  TEST_ASSERT_TRUE(rule_source_allows_value(RuleSource::motion, RuleTriggerValue::clear));
  TEST_ASSERT_FALSE(rule_source_allows_value(RuleSource::motion, RuleTriggerValue::granted));
  TEST_ASSERT_TRUE(rule_source_allows_value(RuleSource::rfid, RuleTriggerValue::granted));
  TEST_ASSERT_FALSE(rule_source_allows_value(RuleSource::rfid, RuleTriggerValue::detected));
}

static void test_sink_rejects_foreign_commands(void)
{
  TEST_ASSERT_TRUE(rule_sink_allows_command(RuleSink::light, RuleCommand::on));
  TEST_ASSERT_TRUE(rule_sink_allows_command(RuleSink::light, RuleCommand::off));
  TEST_ASSERT_FALSE(rule_sink_allows_command(RuleSink::light, RuleCommand::open));
  TEST_ASSERT_TRUE(rule_sink_allows_command(RuleSink::door, RuleCommand::close));
  TEST_ASSERT_FALSE(rule_sink_allows_command(RuleSink::door, RuleCommand::on));
}

static void test_door_open_is_protected_action(void)
{
  RuleAction a = {RuleSink::door, RuleCommand::open};
  RuleAction b = {RuleSink::door, RuleCommand::close};
  RuleAction c = {RuleSink::light, RuleCommand::open};
  TEST_ASSERT_TRUE(rule_is_protected_action(a));
  TEST_ASSERT_FALSE(rule_is_protected_action(b));
  TEST_ASSERT_FALSE(rule_is_protected_action(c));
}

static void test_dynamic_rule_cannot_open_door(void)
{
  Rule r = makeValidRule();
  r.actions[0] = {RuleSink::door, RuleCommand::open};
  r.protectedRule = false;
  TEST_ASSERT_FALSE(rule_valid(r)); // dynamic door OPEN rejected
  r.protectedRule = true;
  TEST_ASSERT_TRUE(rule_valid(r)); // built-in protected rule allowed
}

static void test_rejects_zero_actions_and_overflow(void)
{
  Rule r = makeValidRule();
  r.actionCount = 0;
  TEST_ASSERT_FALSE(rule_valid(r));
  r.actionCount = RULE_MAX_ACTIONS + 1;
  TEST_ASSERT_FALSE(rule_valid(r));
}

static void test_rejects_invalid_stable_ms(void)
{
  Rule r = makeValidRule();
  r.trigger.type = RuleTriggerType::isForMs;
  r.trigger.value = RuleTriggerValue::clear;
  r.trigger.stableMs = 0;
  TEST_ASSERT_FALSE(rule_valid(r));
  r.trigger.stableMs = 10000;
  TEST_ASSERT_TRUE(rule_valid(r));
}

static void test_disabled_rule_is_still_structurally_valid(void)
{
  Rule r = makeValidRule();
  r.enabled = false;
  TEST_ASSERT_TRUE(rule_valid(r)); // enabled is a runtime flag, not structure
}

void run_rule_model_tests()
{
  RUN_TEST(test_valid_rule_passes);
  RUN_TEST(test_motion_source_rejects_rfid_values);
  RUN_TEST(test_sink_rejects_foreign_commands);
  RUN_TEST(test_door_open_is_protected_action);
  RUN_TEST(test_dynamic_rule_cannot_open_door);
  RUN_TEST(test_rejects_zero_actions_and_overflow);
  RUN_TEST(test_rejects_invalid_stable_ms);
  RUN_TEST(test_disabled_rule_is_still_structurally_valid);
}
