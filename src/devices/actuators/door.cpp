#include "door.h"
#include "config.h"

void Door::init(IMqtt &m)
{
  mqtt = &m;
  // Setup SG90 Servo on SERVO_PIN (see config / docs/pin-map.md §1)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  servo.setPeriodHertz(50);           // Standard 50Hz servo
  servo.attach(SERVO_PIN, 500, 2400); // Standard 500us to 2400us range for SG90
  close();                            // Initial state: Closed (0 degrees)
}

void Door::handleCommand(const char *payload, unsigned int)
{
  switch (door_parse_command(payload))
  {
  case DoorCommand::OPEN:
    open();
    break;
  case DoorCommand::CLOSE:
    close();
    break;
  default:
    Serial.println("=> ERROR: Invalid door command, ignored!");
    break;
  }
}

void Door::open()
{
  servo.write(180);
  Serial.println("=> Servo: Door OPEN (180 degrees)");
  isOpen = true;
  if (mqtt->connected())
  {
    mqtt->publishState(TOPIC_STATE_DOOR, "OPEN");
    Serial.println("=> Published: OPEN");
  }
}

void Door::close()
{
  servo.write(0);
  Serial.println("=> Servo: Door CLOSE (0 degrees)");
  isOpen = false;
  if (mqtt->connected())
  {
    mqtt->publishState(TOPIC_STATE_DOOR, "CLOSED");
    Serial.println("=> Published: CLOSED");
  }
}
