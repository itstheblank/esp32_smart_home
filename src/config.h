#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// ETHERNET CONFIG AND MQTT BROKER CONFIG
// ==========================================
extern const char *WIFI_SSID;
extern const char *WIFI_PASSWORD;

extern const char *MQTT_BROKER;
extern const int MQTT_PORT;
extern const char *MQTT_CLIENT_ID;

// ==========================================
// MQTT COMMAND TOPICS (App -> ESP32)
// ==========================================
extern const char *TOPIC_CMD_LIGHT;
extern const char *TOPIC_CMD_DOOR;

// ==========================================
// MQTT STATE TOPICS (ESP32 -> App)
// ==========================================
extern const char *TOPIC_STATE_LIGHT;
extern const char *TOPIC_STATE_DOOR;
extern const char *TOPIC_STATE_MOTION;
extern const char *TOPIC_STATE_ONLINE;

#endif // CONFIG_H
