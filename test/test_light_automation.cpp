#include <unity.h>
#include "devices/actuators/light_automation.h"

static const unsigned long TIMEOUT = 10000;

static LightAutomation make_automation()
{
  return LightAutomation(TIMEOUT);
}

// --- manual commands ---

static void test_manual_on_turns_light_on(void)
{
  LightAutomation a = make_automation();
  TEST_ASSERT_EQUAL(LightAction::ON, a.handleManual(true));
  TEST_ASSERT_TRUE(a.isOn());
}

static void test_manual_off_turns_light_off(void)
{
  LightAutomation a = make_automation();
  a.handleManual(true);
  TEST_ASSERT_EQUAL(LightAction::OFF, a.handleManual(false));
  TEST_ASSERT_FALSE(a.isOn());
}

// --- motion automation ---

static void test_motion_detected_turns_light_on(void)
{
  LightAutomation a = make_automation();
  TEST_ASSERT_EQUAL(LightAction::ON, a.handleStableTransition(true, 1000));
  TEST_ASSERT_TRUE(a.isOn());
}

static void test_clear_starts_timer_only(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(true, 1000);
  TEST_ASSERT_EQUAL(LightAction::NONE, a.handleStableTransition(false, 2000));
  TEST_ASSERT_TRUE(a.isOn()); // still on until timeout
}

static void test_no_motion_timeout_turns_light_off(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(true, 1000);
  a.handleStableTransition(false, 2000);
  TEST_ASSERT_EQUAL(LightAction::NONE, a.tick(2000 + TIMEOUT - 1));
  TEST_ASSERT_EQUAL(LightAction::OFF, a.tick(2000 + TIMEOUT));
  TEST_ASSERT_FALSE(a.isOn());
}

static void test_timer_expires_only_once(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(true, 1000);
  a.handleStableTransition(false, 2000);
  TEST_ASSERT_EQUAL(LightAction::OFF, a.tick(2000 + TIMEOUT));
  TEST_ASSERT_EQUAL(LightAction::NONE, a.tick(2000 + 2 * TIMEOUT));
}

// --- manual override priority (member2 rule) ---

static void test_manual_off_cancels_pending_timer(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(true, 1000);
  a.handleStableTransition(false, 2000); // timer starts
  a.handleManual(false);                 // manual OFF during timer
  TEST_ASSERT_EQUAL(LightAction::NONE, a.tick(2000 + 5 * TIMEOUT));
  TEST_ASSERT_FALSE(a.isOn());
}

static void test_manual_on_blocks_timeout_off(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(true, 1000);
  a.handleStableTransition(false, 2000); // timer starts
  a.handleManual(true);                  // manual ON during timer
  TEST_ASSERT_EQUAL(LightAction::NONE, a.tick(2000 + TIMEOUT));
  TEST_ASSERT_TRUE(a.isOn());
}

static void test_next_pir_transition_returns_control_to_automation(void)
{
  LightAutomation a = make_automation();
  a.handleStableTransition(false, 1000); // timer starts from CLEAR
  a.handleManual(true);                  // override
  TEST_ASSERT_EQUAL(LightAction::NONE, a.tick(1000 + 5 * TIMEOUT));
  // New physical PIR transition clears the override:
  TEST_ASSERT_EQUAL(LightAction::ON, a.handleStableTransition(true, 20000));
  a.handleStableTransition(false, 21000); // timer again
  TEST_ASSERT_EQUAL(LightAction::OFF, a.tick(21000 + TIMEOUT));
}

void run_light_automation_tests()
{
  RUN_TEST(test_manual_on_turns_light_on);
  RUN_TEST(test_manual_off_turns_light_off);
  RUN_TEST(test_motion_detected_turns_light_on);
  RUN_TEST(test_clear_starts_timer_only);
  RUN_TEST(test_no_motion_timeout_turns_light_off);
  RUN_TEST(test_timer_expires_only_once);
  RUN_TEST(test_manual_off_cancels_pending_timer);
  RUN_TEST(test_manual_on_blocks_timeout_off);
  RUN_TEST(test_next_pir_transition_returns_control_to_automation);
}
