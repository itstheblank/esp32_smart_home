#include <unity.h>
#include "devices/actuators/door_actions.h"

static void test_accepts_exact_open(void)
{
  DoorAction a;
  TEST_ASSERT_TRUE(door_action_from_payload("OPEN", &a));
  TEST_ASSERT_EQUAL(DoorAction::DOOR_OPEN, a);
}

static void test_accepts_exact_close(void)
{
  DoorAction a;
  TEST_ASSERT_TRUE(door_action_from_payload("CLOSE", &a));
  TEST_ASSERT_EQUAL(DoorAction::DOOR_CLOSE, a);
}

static void test_rejects_closed_state_word(void)
{
  DoorAction a;
  TEST_ASSERT_FALSE(door_action_from_payload("CLOSED", &a)); // state, not command
}

static void test_rejects_null_and_empty(void)
{
  DoorAction a;
  TEST_ASSERT_FALSE(door_action_from_payload(nullptr, &a));
  TEST_ASSERT_FALSE(door_action_from_payload("", &a));
}

void run_door_actions_tests()
{
  RUN_TEST(test_accepts_exact_open);
  RUN_TEST(test_accepts_exact_close);
  RUN_TEST(test_rejects_closed_state_word);
  RUN_TEST(test_rejects_null_and_empty);
}
