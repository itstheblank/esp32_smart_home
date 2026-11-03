#include <unity.h>
#include "automation/motion_door_logic.h"

static void test_idle_before_motion(void)
{
  MotionDoorLogic logic;
  MotionDoorOutputs out = logic.step(false, 1000);
  TEST_ASSERT_FALSE(out.motionDetected);
  TEST_ASSERT_FALSE(out.doorOpen);
  TEST_ASSERT_FALSE(out.doorClose);
}

static void test_motion_opens_door_immediately(void)
{
  MotionDoorLogic logic;
  MotionDoorOutputs out = logic.step(true, 5000);
  TEST_ASSERT_TRUE(out.motionDetected);
  TEST_ASSERT_TRUE(out.doorOpen);
  TEST_ASSERT_FALSE(out.doorClose);
}

static void test_door_still_open_before_timeout(void)
{
  MotionDoorLogic logic;
  (void)logic.step(true, 5000);
  MotionDoorOutputs out = logic.step(false, 5000 + 1999);
  TEST_ASSERT_FALSE(out.doorClose);
  TEST_ASSERT_FALSE(out.doorOpen);
}

static void test_door_closes_after_2s(void)
{
  MotionDoorLogic logic;
  (void)logic.step(true, 5000);
  MotionDoorOutputs out = logic.step(false, 5000 + 2000);
  TEST_ASSERT_TRUE(out.doorClose);
  TEST_ASSERT_FALSE(out.doorOpen);
}

static void test_motion_during_wait_is_ignored(void)
{
  MotionDoorLogic logic;
  (void)logic.step(true, 5000);
  MotionDoorOutputs out = logic.step(true, 6000);
  TEST_ASSERT_FALSE(out.motionDetected);
  TEST_ASSERT_FALSE(out.doorOpen);
  TEST_ASSERT_FALSE(out.doorClose);
}

static void test_back_to_idle_after_close_then_retrigger(void)
{
  MotionDoorLogic logic;
  (void)logic.step(true, 5000);
  (void)logic.step(false, 7000); // auto close
  MotionDoorOutputs out = logic.step(false, 7100);
  TEST_ASSERT_FALSE(out.doorOpen);
  out = logic.step(true, 7200);
  TEST_ASSERT_TRUE(out.motionDetected);
  TEST_ASSERT_TRUE(out.doorOpen);
}

static void test_reset_returns_to_idle(void)
{
  MotionDoorLogic logic;
  (void)logic.step(true, 5000);
  logic.reset();
  MotionDoorOutputs out = logic.step(false, 6000);
  TEST_ASSERT_FALSE(out.doorClose);
  TEST_ASSERT_TRUE(logic.idle());
}

void run_motion_door_logic_tests()
{
  RUN_TEST(test_idle_before_motion);
  RUN_TEST(test_motion_opens_door_immediately);
  RUN_TEST(test_door_still_open_before_timeout);
  RUN_TEST(test_door_closes_after_2s);
  RUN_TEST(test_motion_during_wait_is_ignored);
  RUN_TEST(test_back_to_idle_after_close_then_retrigger);
  RUN_TEST(test_reset_returns_to_idle);
}
