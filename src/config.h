#ifndef CONFIG_H
#define CONFIG_H

#include <stddef.h>
#include <stdint.h>

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

// ==========================================
// MQTT EVENT TOPICS (ESP32 -> App)
// ==========================================
extern const char *TOPIC_EVENT_ACCESS;

// ==========================================
// MEMBER 2: SENSORS AND AUTOMATION
// Adjust these only after confirming the shared WT32-ETH01 pin map.
// ==========================================
extern const uint8_t PIR_PIN;
extern const uint8_t RFID_SS_PIN;
extern const uint8_t RFID_RST_PIN;
extern const uint8_t RFID_SCK_PIN;
extern const uint8_t RFID_MISO_PIN;
extern const uint8_t RFID_MOSI_PIN;

// PIR must stay in the same state for this long before it is accepted.
extern const unsigned long PIR_STABLE_MS;
// Light turns off this long after a stable no-motion transition.
extern const unsigned long MOTION_NO_MOTION_TIMEOUT_MS;

// Uppercase hexadecimal UIDs, without spaces or separators. Replace the
// example UID with the team's actual authorized cards before demonstration.
extern const char *const RFID_ALLOWED_UIDS[];
extern const size_t RFID_ALLOWED_UID_COUNT;
#endif // CONFIG_H
