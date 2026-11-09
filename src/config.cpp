#include "config.h"

// ==========================================
// NETWORK (WiFi)
// ==========================================
// Set these locally before flashing. Do not commit real credentials.
const char *WIFI_SSID = "Trk95";
const char *WIFI_PASSWORD = "12345678";

// ==========================================
// MQTT BROKER
// ==========================================
const char *MQTT_BROKER = "172.20.10.3"; // IP of the computer running local MQTT Broker (WiFi Trk95 hotspot)
const int MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP32_SmartHome_Core";

// ==========================================
// MQTT TOPICS — COMMANDS (App -> ESP32)
// ==========================================
const char *TOPIC_CMD = "smarthome/cmd";

// ==========================================
// MQTT TOPICS — LOGS (ESP32 -> App, non-retained)
// ==========================================
const char *TOPIC_LOGS = "smarthome/logs";

// ==========================================
// MQTT TOPICS — LEGACY STATE / EVENTS (Deprecated)
// ==========================================
const char *TOPIC_STATE_LIGHT = "smarthome/state/light";
const char *TOPIC_STATE_DOOR = "smarthome/state/door";
const char *TOPIC_STATE_MOTION = "smarthome/state/motion";
const char *TOPIC_STATE_ONLINE = "smarthome/state/online";
const char *TOPIC_EVENT_ACCESS = "smarthome/event/access";

// ==========================================
// HARDWARE PINS
// ==========================================
const uint8_t SERVO_PIN = 2;  // Servo SG90 (door)
const uint8_t LIGHT_PIN = 4;  // Module LED IO4, relay backup IO5
const uint8_t PIR_PIN = 39;   // Input-only GPIO, suitable for PIR output
const uint8_t RFID_SS_PIN = 32;
const uint8_t RFID_RST_PIN = 33;
const uint8_t RFID_SCK_PIN = 14;
const uint8_t RFID_MISO_PIN = 35;
const uint8_t RFID_MOSI_PIN = 17;

// ==========================================
// AUTOMATION TIMING
// ==========================================
const unsigned long PIR_STABLE_MS = 250;
const unsigned long MOTION_NO_MOTION_TIMEOUT_MS = 10000;

// ==========================================
// RFID ACCESS CONTROL
// ==========================================
// Add each authorized card UID here after reading it from Serial Monitor.
const char *const RFID_ALLOWED_UIDS[] = {
    "A1B2C3D4", // Example only -- replace before final demo.
};
const size_t RFID_ALLOWED_UID_COUNT = sizeof(RFID_ALLOWED_UIDS) / sizeof(RFID_ALLOWED_UIDS[0]);
