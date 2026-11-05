#include <unity.h>
#include "devices/actuators/light_command_mapper.h"

static void test_accepts_exact_on(void)
{
  TEST_ASSERT_EQUAL(LightCommand::ON, light_parse_command("ON"));
}

static void test_accepts_exact_off(void)
{
  TEST_ASSERT_EQUAL(LightCommand::OFF, light_parse_command("OFF"));
}

static void test_rejects_lowercase(void)
{
  TEST_ASSERT_EQUAL(LightCommand::INVALID, light_parse_command("on"));
}

static void test_rejects_trailing_newline(void)
{
  TEST_ASSERT_EQUAL(LightCommand::INVALID, light_parse_command("ON\n"));
}

static void test_rejects_quoted(void)
{
  TEST_ASSERT_EQUAL(LightCommand::INVALID, light_parse_command("\"ON\""));
}

static void test_rejects_null(void)
{
  TEST_ASSERT_EQUAL(LightCommand::INVALID, light_parse_command(nullptr));
}

static void test_rejects_empty(void)
{
  TEST_ASSERT_EQUAL(LightCommand::INVALID, light_parse_command(""));
}

void run_light_command_mapper_tests()
{
  RUN_TEST(test_accepts_exact_on);
  RUN_TEST(test_accepts_exact_off);
  RUN_TEST(test_rejects_lowercase);
  RUN_TEST(test_rejects_trailing_newline);
  RUN_TEST(test_rejects_quoted);
  RUN_TEST(test_rejects_null);
  RUN_TEST(test_rejects_empty);
}
