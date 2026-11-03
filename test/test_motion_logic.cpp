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

void run_motion_logic_tests()
{
  RUN_TEST(test_fires_on_rising_edge);
  RUN_TEST(test_no_repeat_while_sustained_high);
  RUN_TEST(test_no_event_on_falling_edge);
  RUN_TEST(test_no_event_while_sustained_low);
  RUN_TEST(test_full_cycle_fires_once_per_activation);
}
