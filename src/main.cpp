#include <Arduino.h>
#include <ETH.h>
#include <PubSubClient.h>
#include "config.h"

#define ETH_PHY_TYPE ETH_PHY_LAN8720
#define ETH_PHY_ADDR 1
#define ETH_PHY_MDC 23
#define ETH_PHY_MDIO 18
#define ETH_PHY_POWER 16
#define ETH_CLK_MODE ETH_CLOCK_GPIO0_IN

bool eth_connected = false;
WiFiClient ethClient;
PubSubClient mqttClient(ethClient);

// Hàm Callback khi nhận tin nhắn từ MQTT (Dành cho Task M1-05 & M1-06)
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.println(message);
}

// Hàm duy trì và kết nối lại MQTT (M1-04)
void reconnectMQTT()
{
  static unsigned long lastAttempt = 0;
  if (!eth_connected)
    return;

  if (millis() - lastAttempt > 5000)
  {
    lastAttempt = millis();
    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect(MQTT_CLIENT_ID))
    {
      Serial.println("connected");

      // Publish trạng thái online (M1-07)
      mqttClient.publish(TOPIC_STATE_ONLINE, "ONLINE", true);

      // Đăng ký nhận lệnh (M1-05)
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

// Bắt sự kiện mạng (M1-03)
void WiFiEvent(WiFiEvent_t event)
{
  switch (event)
  {
  case ARDUINO_EVENT_ETH_START:
    Serial.println("=> Ethernet module has started!");
    ETH.setHostname("smarthome-esp32");
    break;
  case ARDUINO_EVENT_ETH_CONNECTED:
    Serial.println("=> Ethernet connected!");
    break;
  case ARDUINO_EVENT_ETH_GOT_IP:
    Serial.println("=> Got IP: ");
    Serial.println(ETH.localIP());
    eth_connected = true;
    break;
  case ARDUINO_EVENT_ETH_DISCONNECTED:
  case ARDUINO_EVENT_ETH_STOP:
    Serial.println("=> Ethernet disconnected!");
    eth_connected = false;
    break;
  default:
    break;
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("Initializing Ethernet module...");

  WiFi.onEvent(WiFiEvent);

  ETH.begin(ETH_PHY_ADDR, ETH_PHY_POWER, ETH_PHY_MDC, ETH_PHY_MDIO, ETH_PHY_TYPE, ETH_CLK_MODE);

  // Thiết lập MQTT Broker
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void loop()
{
  // Nếu có mạng nhưng rớt MQTT thì tự động reconnect
  if (eth_connected && !mqttClient.connected())
  {
    reconnectMQTT();
  }

  // Vòng lặp duy trì MQTT
  if (mqttClient.connected())
  {
    mqttClient.loop();
  }
}