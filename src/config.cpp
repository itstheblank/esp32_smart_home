#include "config.h"

// Set these locally before flashing. Do not commit real credentials.
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char *MQTT_BROKER = "192.168.137.1"; // IP of the computer running MQTT Broker (from Wireless LAN adapter Wi-Fi)
const int MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP32_SmartHome_Core";

const char *TOPIC_CMD_LIGHT = "smarthome/cmd/light";
const char *TOPIC_CMD_DOOR = "smarthome/cmd/door";

const char *TOPIC_STATE_LIGHT = "smarthome/state/light";
const char *TOPIC_STATE_DOOR = "smarthome/state/door";
const char *TOPIC_STATE_MOTION = "smarthome/state/motion";
const char *TOPIC_STATE_ONLINE = "smarthome/state/online";

const char *TOPIC_EVENT_ACCESS = "smarthome/event/access";

// Member 2 wiring assumptions for WT32-ETH01. GPIO39 is input-only, which is
// suitable for a PIR output. RC522 must be powered from 3.3V, never 5V.
const uint8_t PIR_PIN = 39;
const uint8_t RFID_SS_PIN = 32;
const uint8_t RFID_RST_PIN = 33;
const uint8_t RFID_SCK_PIN = 14;
const uint8_t RFID_MISO_PIN = 35;
const uint8_t RFID_MOSI_PIN = 17;

const unsigned long PIR_STABLE_MS = 250;
const unsigned long MOTION_NO_MOTION_TIMEOUT_MS = 10000;

// Add each authorized card UID here after reading it from Serial Monitor.
const char *const RFID_ALLOWED_UIDS[] = {
    "A1B2C3D4", // Example only -- replace before final demo.
};
const size_t RFID_ALLOWED_UID_COUNT = sizeof(RFID_ALLOWED_UIDS) / sizeof(RFID_ALLOWED_UIDS[0]);
