#include <unity.h>

void run_light_command_mapper_tests();
void run_light_automation_tests();
void run_door_command_mapper_tests();
void run_motion_output_debounce_tests();
void run_rfid_output_access_tests();

int main()
{
  UNITY_BEGIN();
  run_light_command_mapper_tests();
  run_light_automation_tests();
  run_door_command_mapper_tests();
  run_motion_output_debounce_tests();
  run_rfid_output_access_tests();
  return UNITY_END();
}
