#include <unity.h>
#include "devices/door_logic.h"

static void test_accepts_exact_open(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::OPEN, door_parse_command("OPEN"));
}

static void test_accepts_exact_close(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::CLOSE, door_parse_command("CLOSE"));
}

static void test_rejects_lowercase(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::INVALID, door_parse_command("open"));
}

static void test_rejects_trailing_newline(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::INVALID, door_parse_command("CLOSE\n"));
}

static void test_rejects_quoted(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::INVALID, door_parse_command("\"OPEN\""));
}

static void test_rejects_null(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::INVALID, door_parse_command(nullptr));
}

static void test_rejects_empty(void)
{
  TEST_ASSERT_EQUAL(DoorCommand::INVALID, door_parse_command(""));
}

void run_door_logic_tests()
{
  RUN_TEST(test_accepts_exact_open);
  RUN_TEST(test_accepts_exact_close);
  RUN_TEST(test_rejects_lowercase);
  RUN_TEST(test_rejects_trailing_newline);
  RUN_TEST(test_rejects_quoted);
  RUN_TEST(test_rejects_null);
  RUN_TEST(test_rejects_empty);
}
