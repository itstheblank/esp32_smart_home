#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"

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
    if (message == "ON") {
      Serial.println("=> EXECUTE: Turn ON light!");
      // TODO: Call light_on() from Member 3 here
    } 
    else if (message == "OFF") {
      Serial.println("=> EXECUTE: Turn OFF light!");
      // TODO: Call light_off() from Member 3 here
    } 
    else {
      Serial.println("=> ERROR: Invalid light command, ignored!");
    }
  }
  
  // Parse Door Commands
  else if (String(topic) == TOPIC_CMD_DOOR) 
  {
    if (message == "OPEN") {
      Serial.println("=> EXECUTE: Open door!");
      // TODO: Call door_open() from Member 3 here
    } 
    else if (message == "CLOSE") {
      Serial.println("=> EXECUTE: Close door!");
      // TODO: Call door_close() from Member 3 here
    } 
    else {
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
    if (mqttClient.connect(MQTT_CLIENT_ID))
    {
      Serial.println("connected");

      // Publish online state (M1-07)
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
}