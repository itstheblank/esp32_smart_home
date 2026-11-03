#include "door.h"

#define SERVO_PIN 2

void Door::init()
{
  // Setup SG90 Servo on IO2
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  servo.setPeriodHertz(50);           // Standard 50Hz servo
  servo.attach(SERVO_PIN, 500, 2400); // Standard 500us to 2400us range for SG90
  close();                            // Initial state: Closed (0 degrees)
}

void Door::open()
{
  servo.write(180);
  Serial.println("=> Servo: Door OPEN (180 degrees)");
}

void Door::close()
{
  servo.write(0);
  Serial.println("=> Servo: Door CLOSE (0 degrees)");
}
