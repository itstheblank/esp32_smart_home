#include <unity.h>
#include "devices/actuators/light_actions.h"

static void test_accepts_exact_on(void)
{
  LightAction a;
  TEST_ASSERT_TRUE(light_action_from_payload("ON", &a));
  TEST_ASSERT_EQUAL(LightAction::LIGHT_ON, a);
}

static void test_accepts_exact_off(void)
{
  LightAction a;
  TEST_ASSERT_TRUE(light_action_from_payload("OFF", &a));
  TEST_ASSERT_EQUAL(LightAction::LIGHT_OFF, a);
}

static void test_rejects_lowercase_and_quotes_and_json(void)
{
  LightAction a;
  TEST_ASSERT_FALSE(light_action_from_payload("on", &a));
  TEST_ASSERT_FALSE(light_action_from_payload("ON\n", &a));
  TEST_ASSERT_FALSE(light_action_from_payload("\"ON\"", &a));
  TEST_ASSERT_FALSE(light_action_from_payload("{\"light\":\"ON\"}", &a));
}

static void test_rejects_null_and_empty(void)
{
  LightAction a;
  TEST_ASSERT_FALSE(light_action_from_payload(nullptr, &a));
  TEST_ASSERT_FALSE(light_action_from_payload("", &a));
}

void run_light_actions_tests()
{
  RUN_TEST(test_accepts_exact_on);
  RUN_TEST(test_accepts_exact_off);
  RUN_TEST(test_rejects_lowercase_and_quotes_and_json);
  RUN_TEST(test_rejects_null_and_empty);
}
