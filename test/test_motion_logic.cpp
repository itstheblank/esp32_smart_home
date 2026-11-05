#include <unity.h>
#include "devices/motion_logic.h"

static void test_fires_on_rising_edge(void)
{
  TEST_ASSERT_TRUE(motion_is_rising(false, true));
}

static void test_no_repeat_while_sustained_high(void)
{
  TEST_ASSERT_FALSE(motion_is_rising(true, true));
}

static void test_no_event_on_falling_edge(void)
{
  TEST_ASSERT_FALSE(motion_is_rising(true, false));
}

static void test_no_event_while_sustained_low(void)
{
  TEST_ASSERT_FALSE(motion_is_rising(false, false));
}

static void test_full_cycle_fires_once_per_activation(void)
{
  // idle -> detect -> hold -> idle -> detect
  TEST_ASSERT_FALSE(motion_is_rising(false, false));
  TEST_ASSERT_TRUE(motion_is_rising(false, true));
  TEST_ASSERT_FALSE(motion_is_rising(true, true));
  TEST_ASSERT_FALSE(motion_is_rising(true, false));
  TEST_ASSERT_TRUE(motion_is_rising(false, true));
}

// --- MotionDebounceLogic (member2 rule: 250ms stable window) ---

static MotionDebounceLogic make_debouncer()
{
  MotionDebounceLogic logic(250);
  logic.reset(false, 0);
  return logic;
}

static void test_debounce_rejects_short_pulse(void)
{
  MotionDebounceLogic logic = make_debouncer();
  TEST_ASSERT_FALSE(logic.step(true, 100));  // pulse starts
  TEST_ASSERT_FALSE(logic.step(false, 150)); // gone before 250ms
  TEST_ASSERT_FALSE(logic.step(false, 1000));
  TEST_ASSERT_FALSE(logic.stableState());
}

static void test_debounce_accepts_after_stable_window(void)
{
  MotionDebounceLogic logic = make_debouncer();
  TEST_ASSERT_FALSE(logic.step(true, 100));
  bool newStable = false;
  TEST_ASSERT_TRUE(logic.step(true, 350, &newStable)); // 250ms held
  TEST_ASSERT_TRUE(newStable);
  TEST_ASSERT_TRUE(logic.stableState());
}

static void test_debounce_emits_transition_once(void)
{
  MotionDebounceLogic logic = make_debouncer();
  logic.step(true, 100);
  TEST_ASSERT_TRUE(logic.step(true, 350));
  TEST_ASSERT_FALSE(logic.step(true, 400)); // sustained high: no repeat
}

static void test_debounce_restart_window_on_flip_back(void)
{
  MotionDebounceLogic logic = make_debouncer();
  TEST_ASSERT_FALSE(logic.step(true, 100));
  TEST_ASSERT_FALSE(logic.step(false, 200)); // flip back restarts window
  TEST_ASSERT_FALSE(logic.step(true, 300));
  TEST_ASSERT_FALSE(logic.step(true, 549));  // 249ms — just under the window
  TEST_ASSERT_TRUE(logic.step(true, 550));
}

void run_motion_logic_tests()
{
  RUN_TEST(test_fires_on_rising_edge);
  RUN_TEST(test_no_repeat_while_sustained_high);
  RUN_TEST(test_no_event_on_falling_edge);
  RUN_TEST(test_no_event_while_sustained_low);
  RUN_TEST(test_full_cycle_fires_once_per_activation);
  RUN_TEST(test_debounce_rejects_short_pulse);
  RUN_TEST(test_debounce_accepts_after_stable_window);
  RUN_TEST(test_debounce_emits_transition_once);
  RUN_TEST(test_debounce_restart_window_on_flip_back);
}
