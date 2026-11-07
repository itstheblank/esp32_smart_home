#ifndef MQTT_SERVICE_H
#define MQTT_SERVICE_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <PubSubClient.h>

typedef void (*CommandHandler)(const char *payload, unsigned int length);

class MqttService
{
public:
  static MqttService &instance()
  {
    static MqttService s_instance;
    return s_instance;
  }

  MqttService(const MqttService &) = delete;
  MqttService &operator=(const MqttService &) = delete;

  void begin(const char *broker, int port, const char *clientId, const char *lwtTopic);
  void loop();
  bool connected();
  void onCommand(const char *topic, CommandHandler handler);
  bool publishState(const char *topic, const char *payload);
  bool publishEvent(const char *topic, const char *payload);

private:
  MqttService() = default;

  static const int MAX_COMMANDS = 8;

  WiFiClient wifiClient;
  PubSubClient client;
  const char *clientId = nullptr;
  const char *lwtTopic = nullptr;
  const char *commandTopics[MAX_COMMANDS] = {nullptr};
  CommandHandler commandHandlers[MAX_COMMANDS] = {nullptr};
  int commandCount = 0;
  unsigned long lastAttempt = 0;
};

#endif // MQTT_SERVICE_H
