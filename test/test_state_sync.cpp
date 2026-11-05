#include <unity.h>
#include "devices/state_sync.h"

static void test_no_publish_when_clean(void)
{
  StateSync s;
  TEST_ASSERT_FALSE(s.shouldPublish(true));
}

static void test_no_publish_while_offline(void)
{
  StateSync s;
  s.mark();
  TEST_ASSERT_FALSE(s.shouldPublish(false));
}

static void test_publishes_once_when_connected(void)
{
  StateSync s;
  s.mark();
  TEST_ASSERT_TRUE(s.shouldPublish(true));
  TEST_ASSERT_FALSE(s.shouldPublish(true)); // exactly once
}

static void test_publishes_after_reconnect_while_offline(void)
{
  StateSync s;
  s.mark();
  TEST_ASSERT_FALSE(s.shouldPublish(false)); // transition while offline
  TEST_ASSERT_TRUE(s.shouldPublish(true));   // publish right after reconnect
}

static void test_change_while_offline_still_publishes_latest(void)
{
  StateSync s;
  s.mark();
  TEST_ASSERT_FALSE(s.shouldPublish(false));
  s.mark(); // another transition while still offline
  TEST_ASSERT_TRUE(s.shouldPublish(true));
}

void run_state_sync_tests()
{
  RUN_TEST(test_no_publish_when_clean);
  RUN_TEST(test_no_publish_while_offline);
  RUN_TEST(test_publishes_once_when_connected);
  RUN_TEST(test_publishes_after_reconnect_while_offline);
  RUN_TEST(test_change_while_offline_still_publishes_latest);
}
