#include "mqtt_service.h"
#include "network.h"
#include <string.h>

static const unsigned long RECONNECT_INTERVAL_MS = 5000;
static const int MQTT_KEEP_ALIVE_S = 30;      // Clean session, Keep Alive 30s
static const int MQTT_LWT_QOS = 0;            // LWT: QoS 0, Retain true, payload "OFFLINE"
static const int PAYLOAD_BUFFER_SIZE = 160;

static const char *LWT_OFFLINE = "{\"device\":\"SYSTEM\",\"id\":0,\"action\":\"OFFLINE\",\"success\":true,\"data\":{}}";
static const char *LWT_ONLINE = "{\"device\":\"SYSTEM\",\"id\":0,\"action\":\"ONLINE\",\"success\":true,\"data\":{}}";

// Wire a fresh broker session: publish online state and (re)subscribe to command topics.
static void connectOnce(PubSubClient &client, const char *clientId, const char *lwtTopic,
                        const char *const *commandTopics, int commandCount)
{
  Serial.print("Attempting MQTT connection...");
  if (client.connect(clientId, lwtTopic, MQTT_LWT_QOS, false, LWT_OFFLINE))
  {
    Serial.println("connected");

    // Publish online state (non-retained)
    client.publish(lwtTopic, LWT_ONLINE, false);

    // Subscribe to command topics (M1-05)
    for (int i = 0; i < commandCount; i++)
    {
      client.subscribe(commandTopics[i]);
    }
  }
  else
  {
    Serial.print("failed, rc=");
    Serial.print(client.state());
    Serial.println(" try again in 5 seconds");
  }
}

// MQTT callback (Task M1-05 & M1-06): buffer, log and dispatch to the matching handler.
static void dispatchMessage(const char *const *commandTopics, CommandHandler *commandHandlers,
                            int commandCount, char *topic, byte *payload, unsigned int length)
{
  static char buffer[PAYLOAD_BUFFER_SIZE];
  unsigned int n = length < PAYLOAD_BUFFER_SIZE - 1 ? length : PAYLOAD_BUFFER_SIZE - 1;
  memcpy(buffer, payload, n);
  buffer[n] = '\0';

  for (int i = 0; i < commandCount; i++)
  {
    if (strcmp(topic, commandTopics[i]) == 0)
    {
      commandHandlers[i](buffer, n);
      break;
    }
  }
}

void MqttService::begin(const char *broker, int port, const char *id, const char *lwt)
{
  clientId = id;
  lwtTopic = lwt;
  commandCount = 0;
  lastAttempt = 0;

  client.setClient(wifiClient);
  client.setServer(broker, port);
  client.setKeepAlive(MQTT_KEEP_ALIVE_S);
  client.setCallback([this](char *topic, byte *payload, unsigned int length) {
    dispatchMessage(commandTopics, commandHandlers, commandCount, topic, payload, length);
  });
}

void MqttService::onCommand(const char *topic, CommandHandler handler)
{
  if (commandCount < MAX_COMMANDS)
  {
    commandTopics[commandCount] = topic;
    commandHandlers[commandCount] = handler;
    commandCount++;
    if (client.connected())
    {
      client.subscribe(topic);
      Serial.printf("=> Subscribed to command topic: %s\n", topic);
    }
  }
}

bool MqttService::connected()
{
  return client.connected();
}

bool MqttService::publishState(const char *topic, const char *payload)
{
  return client.publish(topic, payload, true);
}

bool MqttService::publishEvent(const char *topic, const char *payload)
{
  return client.publish(topic, payload, false);
}

// Maintain and reconnect MQTT (M1-04)
void MqttService::loop()
{
  if (!network_connected())
    return;

  if (client.connected())
  {
    client.loop();
  }
  else if (millis() - lastAttempt > RECONNECT_INTERVAL_MS)
  {
    lastAttempt = millis();
    connectOnce(client, clientId, lwtTopic, commandTopics, commandCount);
  }
}
