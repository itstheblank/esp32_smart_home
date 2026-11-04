#include <unity.h>
#include "devices/rfid_logic.h"

static void test_format_uid_four_bytes(void)
{
  const uint8_t uid[4] = {0xA1, 0xB2, 0xC3, 0xD4};
  char out[16];
  TEST_ASSERT_TRUE(rfid_format_uid(uid, 4, out, sizeof(out)));
  TEST_ASSERT_EQUAL_STRING("A1B2C3D4", out);
}

static void test_format_uid_uppercase_letters(void)
{
  const uint8_t uid[1] = {0xAB};
  char out[8];
  TEST_ASSERT_TRUE(rfid_format_uid(uid, 1, out, sizeof(out)));
  TEST_ASSERT_EQUAL_STRING("AB", out);
}

static void test_format_uid_seven_bytes(void)
{
  const uint8_t uid[7] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xEF, 0x0F};
  char out[20];
  TEST_ASSERT_TRUE(rfid_format_uid(uid, 7, out, sizeof(out)));
  TEST_ASSERT_EQUAL_STRING("0123456789EF0F", out);
}

static void test_format_uid_buffer_too_small(void)
{
  const uint8_t uid[4] = {0xA1, 0xB2, 0xC3, 0xD4};
  char out[8]; // needs 9
  TEST_ASSERT_FALSE(rfid_format_uid(uid, 4, out, sizeof(out)));
  TEST_ASSERT_EQUAL_STRING("", out);
}

static void test_format_uid_rejects_null_and_zero_len(void)
{
  const uint8_t uid[4] = {0xA1, 0xB2, 0xC3, 0xD4};
  char out[16];
  TEST_ASSERT_FALSE(rfid_format_uid(nullptr, 4, out, sizeof(out)));
  TEST_ASSERT_FALSE(rfid_format_uid(uid, 0, out, sizeof(out)));
  TEST_ASSERT_FALSE(rfid_format_uid(uid, 4, nullptr, sizeof(out)));
  TEST_ASSERT_EQUAL_STRING("", out);
}

static void test_access_granted_for_known_uid(void)
{
  const char *const whitelist[] = {"A1B2C3D4", "11223344"};
  TEST_ASSERT_EQUAL_STRING("GRANTED", rfid_check_access("A1B2C3D4", whitelist, 2));
  TEST_ASSERT_EQUAL_STRING("GRANTED", rfid_check_access("11223344", whitelist, 2));
}

static void test_access_denied_for_unknown_uid(void)
{
  const char *const whitelist[] = {"A1B2C3D4"};
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access("DEADBEEF", whitelist, 1));
}

static void test_access_denied_on_case_mismatch(void)
{
  const char *const whitelist[] = {"A1B2C3D4"};
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access("a1b2c3d4", whitelist, 1));
}

static void test_access_denied_on_null_or_empty(void)
{
  const char *const whitelist[] = {"A1B2C3D4"};
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access(nullptr, whitelist, 1));
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access("", whitelist, 1));
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access("A1B2C3D4", nullptr, 1));
  TEST_ASSERT_EQUAL_STRING("DENIED", rfid_check_access("A1B2C3D4", whitelist, 0));
}

static void test_access_denied_result_strings_match_contract(void)
{
  TEST_ASSERT_EQUAL_STRING(RFID_RESULT_GRANTED, "GRANTED");
  TEST_ASSERT_EQUAL_STRING(RFID_RESULT_DENIED, "DENIED");
}

static void test_format_then_check_end_to_end(void)
{
  const uint8_t raw[4] = {0xDE, 0xAD, 0xBE, 0xEF};
  const char *const whitelist[] = {"DEADBEEF"};
  char uid[16];
  TEST_ASSERT_TRUE(rfid_format_uid(raw, 4, uid, sizeof(uid)));
  TEST_ASSERT_EQUAL_STRING("GRANTED", rfid_check_access(uid, whitelist, 1));
}

void run_rfid_logic_tests()
{
  RUN_TEST(test_format_uid_four_bytes);
  RUN_TEST(test_format_uid_uppercase_letters);
  RUN_TEST(test_format_uid_seven_bytes);
  RUN_TEST(test_format_uid_buffer_too_small);
  RUN_TEST(test_format_uid_rejects_null_and_zero_len);
  RUN_TEST(test_access_granted_for_known_uid);
  RUN_TEST(test_access_denied_for_unknown_uid);
  RUN_TEST(test_access_denied_on_case_mismatch);
  RUN_TEST(test_access_denied_on_null_or_empty);
  RUN_TEST(test_access_denied_result_strings_match_contract);
  RUN_TEST(test_format_then_check_end_to_end);
}
