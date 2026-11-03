#ifndef MQTT_SERVICE_H
#define MQTT_SERVICE_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <PubSubClient.h>

class IMqtt
{
public:
  virtual bool publishState(const char *topic, const char *payload) = 0; // Retain true (contract §2)
  virtual bool publishEvent(const char *topic, const char *payload) = 0; // Retain false (contract §2)
  virtual bool connected() = 0;
  virtual ~IMqtt() {}
};

typedef void (*CommandHandler)(const char *payload, unsigned int length);

class MqttService : public IMqtt
{
public:
  void begin(const char *broker, int port, const char *clientId, const char *lwtTopic);
  void loop();
  bool connected();
  void onCommand(const char *topic, CommandHandler handler);
  bool publishState(const char *topic, const char *payload);
  bool publishEvent(const char *topic, const char *payload);

private:
  static const int MAX_COMMANDS = 8;
  void connect();
  void handleMessage(char *topic, byte *payload, unsigned int length);

  WiFiClient wifiClient;
  PubSubClient client;
  const char *clientId;
  const char *lwtTopic;
  const char *commandTopics[MAX_COMMANDS];
  CommandHandler commandHandlers[MAX_COMMANDS];
  int commandCount;
  unsigned long lastAttempt;
};

#endif // MQTT_SERVICE_H
