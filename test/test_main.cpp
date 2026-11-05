#include <unity.h>

void run_light_actions_tests();
void run_light_automation_tests();
void run_door_actions_tests();
void run_motion_output_debounce_tests();
void run_rfid_output_access_tests();
void run_rule_model_tests();

int main()
{
  UNITY_BEGIN();
  run_light_actions_tests();
  run_light_automation_tests();
  run_door_actions_tests();
  run_motion_output_debounce_tests();
  run_rfid_output_access_tests();
  run_rule_model_tests();
  return UNITY_END();
}
