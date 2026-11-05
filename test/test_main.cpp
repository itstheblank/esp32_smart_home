#include <unity.h>

void run_light_logic_tests();
void run_light_automation_tests();
void run_door_logic_tests();
void run_motion_logic_tests();
void run_rfid_logic_tests();
void run_state_sync_tests();

int main()
{
  UNITY_BEGIN();
  run_light_logic_tests();
  run_light_automation_tests();
  run_door_logic_tests();
  run_motion_logic_tests();
  run_rfid_logic_tests();
  run_state_sync_tests();
  return UNITY_END();
}
