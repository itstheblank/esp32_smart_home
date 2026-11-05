#ifndef CONFIG_H
#define CONFIG_H

#include <stddef.h>
#include <stdint.h>

// ==========================================
// NETWORK (WiFi)
// ==========================================
extern const char *WIFI_SSID;
extern const char *WIFI_PASSWORD;

// ==========================================
// MQTT BROKER
// ==========================================
extern const char *MQTT_BROKER;
extern const int MQTT_PORT;
extern const char *MQTT_CLIENT_ID;

// ==========================================
// MQTT TOPICS — COMMANDS (App -> ESP32)
// ==========================================
extern const char *TOPIC_CMD_LIGHT;
extern const char *TOPIC_CMD_DOOR;

// ==========================================
// MQTT TOPICS — STATE (ESP32 -> App, retained)
// ==========================================
extern const char *TOPIC_STATE_LIGHT;
extern const char *TOPIC_STATE_DOOR;
extern const char *TOPIC_STATE_MOTION;
extern const char *TOPIC_STATE_ONLINE;

// ==========================================
// MQTT TOPICS — EVENTS (ESP32 -> App, non-retained)
// ==========================================
extern const char *TOPIC_EVENT_ACCESS;

// ==========================================
// HARDWARE PINS
// GPIO39 and GPIO35 are input-only. RC522 must be powered from 3.3V, never 5V.
// ==========================================
extern const uint8_t SERVO_PIN;
extern const uint8_t LIGHT_PIN;
extern const uint8_t PIR_PIN;
extern const uint8_t RFID_SS_PIN;
extern const uint8_t RFID_RST_PIN;
extern const uint8_t RFID_SCK_PIN;
extern const uint8_t RFID_MISO_PIN;
extern const uint8_t RFID_MOSI_PIN;

// ==========================================
// AUTOMATION TIMING
// ==========================================
// PIR must stay in the same state for this long before it is accepted.
extern const unsigned long PIR_STABLE_MS;
// Light turns off this long after a stable no-motion transition.
extern const unsigned long MOTION_NO_MOTION_TIMEOUT_MS;

// ==========================================
// RFID ACCESS CONTROL
// ==========================================
// Uppercase hexadecimal UIDs, without spaces or separators. Replace the
// example UID with the team's actual authorized cards before demonstration.
extern const char *const RFID_ALLOWED_UIDS[];
extern const size_t RFID_ALLOWED_UID_COUNT;
#endif // CONFIG_H
