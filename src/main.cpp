#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include "config.h"

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

bool wifi_connected = false;
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// MQTT Callback function (For Task M1-05 & M1-06)
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] : ");
  Serial.println(message);

  // --- COMMAND PARSING FROM APP (Task M1-06) ---

  // Parse Light Commands
  if (String(topic) == TOPIC_CMD_LIGHT)
  {
    if (message == "ON")
    {
      mqttClient.publish(TOPIC_STATE_LIGHT, "ESP32 SEND ON", true);
      Serial.println("=> Published: ESP32 SEND ON");
      // TODO: Call light_on() from Member 3 here
    }
    else if (message == "OFF")
    {
      mqttClient.publish(TOPIC_STATE_LIGHT, "ESP32 SEND OFF", true);
      Serial.println("=> Published: ESP32 SEND OFF");
      // TODO: Call light_off() from Member 3 here
    }
    else
    {
      Serial.println("=> ERROR: Invalid light command, ignored!");
    }
  }

  // Parse Door Commands
  else if (String(topic) == TOPIC_CMD_DOOR)
  {
    if (message == "OPEN")
    {
      door_open();
      mqttClient.publish(TOPIC_STATE_DOOR, "ESP32 SEND OPEN", true);
      Serial.println("=> Published: ESP32 SEND OPEN");
    }
    else if (message == "CLOSE")
    {
      door_close();
      mqttClient.publish(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED", true);
      Serial.println("=> Published: ESP32 SEND CLOSED");
    }
    else
    {
      Serial.println("=> ERROR: Invalid door command, ignored!");
    }
  }
}

// Function to maintain and reconnect MQTT (M1-04)
void reconnectMQTT()
{
  static unsigned long lastAttempt = 0;
  if (!wifi_connected)
    return;

  if (millis() - lastAttempt > 5000)
  {
    lastAttempt = millis();
    Serial.print("Attempting MQTT connection...");
    // Connect with Last Will and Testament (LWT) as specified in MQTT Contract v1.0.0:
    // Topic: TOPIC_STATE_ONLINE, QoS: 0, Retain: true, Payload: "OFFLINE"
    if (mqttClient.connect(MQTT_CLIENT_ID, TOPIC_STATE_ONLINE, 0, true, "OFFLINE"))
    {
      Serial.println("connected");

      // Publish online state (M1-07 / Contract M5-03)
      mqttClient.publish(TOPIC_STATE_ONLINE, "ONLINE", true);

      // Subscribe to command topics (M1-05)
      mqttClient.subscribe(TOPIC_CMD_LIGHT);
      mqttClient.subscribe(TOPIC_CMD_DOOR);
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
    }
  }
}

// Handle WiFi events (M1-03)
void WiFiEvent(WiFiEvent_t event)
{
  switch (event)
  {
  case ARDUINO_EVENT_WIFI_STA_START:
    Serial.println("=> WiFi module has started!");
    break;
  case ARDUINO_EVENT_WIFI_STA_CONNECTED:
    Serial.println("=> WiFi connected!");
    break;
  case ARDUINO_EVENT_WIFI_STA_GOT_IP:
    Serial.print("=> Got IP: ");
    Serial.println(WiFi.localIP());
    wifi_connected = true;
    break;
  case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
    Serial.println("=> WiFi disconnected!");
    wifi_connected = false;
    break;
  default:
    break;
  }
}

unsigned long lastWifiAttempt = 0;

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("Initializing WiFi module...");

  WiFi.onEvent(WiFiEvent);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Setup MQTT Broker
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(30); // Clean session, Keep Alive 30s as per Contract M5-03

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
  // Automatically reconnect WiFi if disconnected
  if (!wifi_connected)
  {
    if (millis() - lastWifiAttempt > 5000)
    {
      Serial.println("Attempting WiFi connection...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      lastWifiAttempt = millis();
    }
  }
  // Automatically reconnect MQTT if WiFi is connected but MQTT is dropped
  else if (wifi_connected && !mqttClient.connected())
  {
    reconnectMQTT();
  }

  // Maintain MQTT connection
  if (mqttClient.connected())
  {
    mqttClient.loop();
  }

  // --- PIR MOTION DETECTION (IO39) ---
  static int lastMotionState = LOW;
  int currentMotion = digitalRead(PIR_PIN);

  // Trigger when motion transitions from LOW to HIGH (rising edge)
  if (currentMotion == HIGH && lastMotionState == LOW)
  {
    Serial.println("=> Motion DETECTED on IO39!");

    // 1. Send message: ESP32 DETECT MOTION
    if (mqttClient.connected())
    {
      mqttClient.publish(TOPIC_STATE_MOTION, "ESP32 DETECT MOTION", true);
      Serial.println("=> Published: ESP32 DETECT MOTION");
    }

    // 2. Open the door
    door_open();
    if (mqttClient.connected())
    {
      mqttClient.publish(TOPIC_STATE_DOOR, "ESP32 SEND OPEN", true);
      Serial.println("=> Published: ESP32 SEND OPEN");
    }

    // 3. Wait 2 seconds (servicing MQTT loop in background)
    unsigned long waitStart = millis();
    while (millis() - waitStart < 2000)
    {
      if (mqttClient.connected())
      {
        mqttClient.loop();
      }
      delay(10);
    }

    // 4. Send message: ESP32 SEND CLOSED
    if (mqttClient.connected())
    {
      mqttClient.publish(TOPIC_STATE_DOOR, "ESP32 SEND CLOSED", true);
      Serial.println("=> Published: ESP32 SEND CLOSED");
    }

    // 5. Close the door
    door_close();
  }

  lastMotionState = currentMotion;
}