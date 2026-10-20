#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include "config.h"
#include "actuator_interface.h"
#include "sensor_interface.h"

// =========================================================================
// KHAI BÁO BIẾN TOÀN CỤC & TRẠNG THÁI HỆ THỐNG
// =========================================================================
bool wifi_connected = false;
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Lưu trữ trạng thái hiện tại của thiết bị trong bộ nhớ Core
static bool currentLightState = false;  // false = OFF, true = ON
static bool currentDoorState = false;   // false = CLOSED, true = OPEN
static bool currentMotionState = false; // false = CLEAR, true = DETECTED

// =========================================================================
// M1-07: CÁC HÀM PUBLISH DEVICE STATE
// =========================================================================
void publishLightState(bool isOn)
{
  currentLightState = isOn;
  const char *payload = isOn ? "ON" : "OFF";
  if (mqttClient.connected())
  {
    mqttClient.publish(TOPIC_STATE_LIGHT, payload, true);
    Serial.printf("[STATE] Light -> %s (Published)\n", payload);
  }
}

void publishDoorState(bool isOpen)
{
  currentDoorState = isOpen;
  const char *payload = isOpen ? "OPEN" : "CLOSED";
  if (mqttClient.connected())
  {
    mqttClient.publish(TOPIC_STATE_DOOR, payload, true); // Retain = true
    Serial.printf("[STATE] Door -> %s (Published)\n", payload);
  }
}
void publishMotionState(bool detected)
{
  currentMotionState = detected;
  const char *payload = detected ? "DETECTED" : "CLEAR";
  if (mqttClient.connected())
  {
    mqttClient.publish(TOPIC_STATE_MOTION, payload, true); // Retain = true
    Serial.printf("[STATE] Motion -> %s (Published)\n", payload);
  }
}

// =========================================================================
// M1-08: IMPLEMENTATION CỦA ACTUATOR INTERFACE (Dành cho Member 3)
// =========================================================================
#define SERVO_PIN 2
#define RELAY_PIN 14

Servo doorServo;
namespace ActuatorInterface
{
  void init()
  {
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW); // Mặc định tắt đèn
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    doorServo.setPeriodHertz(50);
    doorServo.attach(SERVO_PIN, 500, 2400);
    doorServo.write(0); // Mặc định đóng cửa (0 độ)
  }
  bool setLight(bool turnOn)
  {
    digitalWrite(RELAY_PIN, turnOn ? HIGH : LOW);
    return true;
  }
  bool openDoor()
  {
    doorServo.write(180); // Mở cửa góc 180 độ
    return true;
  }
  bool closeDoor()
  {
    doorServo.write(0); // Đóng cửa góc 0 độ
    return true;
  }
}
// =========================================================================
// M1-09: IMPLEMENTATION CỦA SENSOR INTERFACE (Dành cho Member 2)
// =========================================================================
namespace SensorInterface
{
  void notifyMotionState(bool detected)
  {
    publishMotionState(detected);
  }
  void notifyRFIDAccess(const char *uid, bool isGranted)
  {
    if (!mqttClient.connected())
      return;
    // Đóng gói JSON chuẩn: {"uid":"...","result":"GRANTED/DENIED"}
    char jsonBuffer[128];
    snprintf(jsonBuffer, sizeof(jsonBuffer), "{\"uid\":\"%s\",\"result\":\"%s\"}",
             uid, isGranted ? "GRANTED" : "DENIED");
    // Publish sự kiện quẹt thẻ (Retain = false theo contract)
    mqttClient.publish(TOPIC_EVENT_ACCESS, jsonBuffer, false);
    Serial.printf("[EVENT] RFID Access: %s\n", jsonBuffer);
    // Nếu thẻ hợp lệ -> Tự động mở cửa
    if (isGranted)
    {
      if (ActuatorInterface::openDoor())
      {
        publishDoorState(true);
      }
    }
  }
}
// =========================================================================
// M1-10: ĐỒNG BỘ TRẠNG THÁI SAU KHI RECONNECT (State Sync)
// =========================================================================
void syncAllStatesAfterReconnect()
{
  Serial.println("=> [M1-10] Syncing all device states to Broker...");

  // Gửi lại trạng thái đèn, cửa, chuyển động (Retain: true)
  publishLightState(currentLightState);
  publishDoorState(currentDoorState);
  publishMotionState(currentMotionState);
  // Cuối cùng gửi trạng thái ONLINE
  mqttClient.publish(TOPIC_STATE_ONLINE, "ONLINE", true);
  Serial.println("=> [M1-10] Device is ONLINE and in-sync!");
}

// =========================================================================
// MQTT CALLBACK (M1-05 & M1-06 kết nối M1-08)
// =========================================================================
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.printf("Message arrived [%s] : %s\n", topic, message.c_str());

  // --- COMMAND PARSING FROM APP (Task M1-06) ---

  // Parse Light Commands
  if (String(topic) == TOPIC_CMD_LIGHT)
  {
    if (message == "ON")
    {
      if (ActuatorInterface::setLight(true))
        publishLightState(true);
    }
    else if (message == "OFF")
    {
      if (ActuatorInterface::setLight(false))
        publishLightState(false);
    }
    else
    {
      Serial.println("=> ERROR: Invalid light command!");
    }
  }

  // Parse Door Commands
  else if (String(topic) == TOPIC_CMD_DOOR)
  {
    if (message == "OPEN")
    {
      if (ActuatorInterface::openDoor())
        publishDoorState(true);
    }
    else if (message == "CLOSE")
    {
      if (ActuatorInterface::closeDoor())
        publishDoorState(false);
    }
    else
    {
      Serial.println("=> ERROR: Invalid door command!");
    }
  }
}

// =========================================================================
// M1-04: QUẢN LÝ KẾT NỐI MQTT & LAST WILL
// =========================================================================
void reconnectMQTT()
{
  static unsigned long lastAttempt = 0;
  if (!wifi_connected)
    return;
  if (millis() - lastAttempt > 5000)
  {
    lastAttempt = millis();
    Serial.print("Attempting MQTT connection...");
    // Kết nối với Last Will: topic online, retain = true, payload = "OFFLINE"
    if (mqttClient.connect(MQTT_CLIENT_ID, TOPIC_STATE_ONLINE, 0, true, "OFFLINE"))
    {
      Serial.println("connected!");
      // Subscribe lệnh điều khiển (M1-05)
      mqttClient.subscribe(TOPIC_CMD_LIGHT);
      mqttClient.subscribe(TOPIC_CMD_DOOR);
      // M1-10: Đồng bộ toàn bộ trạng thái sau khi kết nối lại
      syncAllStatesAfterReconnect();
    }
    else
    {
      Serial.printf("failed, rc=%d. Try again in 5 seconds\n", mqttClient.state());
    }
  }
}
// =========================================================================
// M1-03: XỬ LÝ SỰ KIỆN WIFI
// =========================================================================
void WiFiEvent(WiFiEvent_t event)
{
  switch (event)
  {
  case ARDUINO_EVENT_WIFI_STA_START:
    Serial.println("=> WiFi module started!");
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
  Serial.println("Initializing ESP32 SmartHome Core...");
  // Khởi tạo phần cứng Actuator
  ActuatorInterface::init();
  // Khởi tạo WiFi
  WiFi.onEvent(WiFiEvent);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  // Cấu hình MQTT Client
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(30);
}
void loop()
{
  // Tự động kết nối lại WiFi nếu mất mạng
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
  // Tự động kết nối lại MQTT nếu có WiFi nhưng mất MQTT
  else if (wifi_connected && !mqttClient.connected())
  {
    reconnectMQTT();
  }
  // Duy trì xử lý gói tin MQTT
  if (mqttClient.connected())
  {
    mqttClient.loop();
  }
}