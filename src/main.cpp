#include <Arduino.h>
#include <string.h>
#include <ESP32Servo.h>
#include "config.h"
#include "core/network.h"
#include "core/mqtt_service.h"

// =========================================================================
// SERVO CONFIGURATION (SG90)
// OPEN:  180 degrees
// CLOSE: 0 degrees
// =========================================================================
#define SERVO_PIN 2
#define PIR_PIN 39

Servo doorServo;

void door_open()
{
  doorServo.write(180);
  Serial.println("=> Servo: Door OPEN (180 degrees)");
}

void door_close()
{
  doorServo.write(0);
  Serial.println("=> Servo: Door CLOSE (0 degrees)");
}

MqttService mqtt;

// Light command handler (M1-06)
static void handleLightCommand(const char *payload, unsigned int)
{
  if (strcmp(payload, "ON") == 0)
  {
    mqtt.publishState(TOPIC_STATE_LIGHT, "ESP32 SEND ON");
    Serial.println("=> Published: ESP32 SEND ON");
    // TODO: Call light_on() from Member 3 here
  }
  else if (strcmp(payload, "OFF") == 0)
  {
    mqtt.publishState(TOPIC_STATE_LIGHT, "ESP32 SEND OFF");
    Serial.println("=> Published: ESP32 SEND OFF");
    // TODO: Call light_off() from Member 3 here
  }
  else
  {
    Serial.println("=> ERROR: Invalid light command, ignored!");
  }
}

// Door command handler (M1-06)
static void handleDoorCommand(const char *payload, unsigned int)
{
  if (strcmp(payload, "OPEN") == 0)
  {
    door_open();
    mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND OPEN");
    Serial.println("=> Published: ESP32 SEND OPEN");
  }
  else if (strcmp(payload, "CLOSE") == 0)
  {
    door_close();
    mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED");
    Serial.println("=> Published: ESP32 SEND CLOSED");
  }
  else
  {
    Serial.println("=> ERROR: Invalid door command, ignored!");
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("Initializing WiFi module...");

  network_begin(WIFI_SSID, WIFI_PASSWORD);

  // Setup MQTT Broker
  mqtt.begin(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID, TOPIC_STATE_ONLINE);
  mqtt.onCommand(TOPIC_CMD_LIGHT, handleLightCommand);
  mqtt.onCommand(TOPIC_CMD_DOOR, handleDoorCommand);

  // Setup HC-SR501 PIR sensor on IO39
  pinMode(PIR_PIN, INPUT);

  // Setup SG90 Servo on IO2
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  doorServo.setPeriodHertz(50);           // Standard 50Hz servo
  doorServo.attach(SERVO_PIN, 500, 2400); // Standard 500us to 2400us range for SG90
  door_close();                           // Initial state: Closed (0 degrees)
}

void loop()
{
  network_loop();
  mqtt.loop();

  // --- PIR MOTION DETECTION (IO39) ---
  static int lastMotionState = LOW;
  int currentMotion = digitalRead(PIR_PIN);

  // Trigger when motion transitions from LOW to HIGH (rising edge)
  if (currentMotion == HIGH && lastMotionState == LOW)
  {
    Serial.println("=> Motion DETECTED on IO39!");

    // 1. Send message: ESP32 DETECT MOTION
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_MOTION, "ESP32 DETECT MOTION");
      Serial.println("=> Published: ESP32 DETECT MOTION");
    }

    // 2. Open the door
    door_open();
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND OPEN");
      Serial.println("=> Published: ESP32 SEND OPEN");
    }

    // 3. Wait 2 seconds (servicing MQTT loop in background)
    unsigned long waitStart = millis();
    while (millis() - waitStart < 2000)
    {
      if (mqtt.connected())
      {
        mqtt.loop();
      }
      delay(10);
    }

    // 4. Send message: ESP32 SEND CLOSED
    if (mqtt.connected())
    {
      mqtt.publishState(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED");
      Serial.println("=> Published: ESP32 SEND CLOSED");
    }

    // 5. Close the door
    door_close();
  }

  lastMotionState = currentMotion;
}
