#include "config.h"

const char *WIFI_SSID = "Blank";
const char *WIFI_PASSWORD = "12345678";

const char *MQTT_BROKER = "192.168.137.1"; // IP of the computer running MQTT Broker (from Wireless LAN adapter Wi-Fi)
const int MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP32_SmartHome_Core";

const char *TOPIC_CMD_LIGHT = "smarthome/cmd/light";
const char *TOPIC_CMD_DOOR = "smarthome/cmd/door";

const char *TOPIC_STATE_LIGHT = "smarthome/state/light";
const char *TOPIC_STATE_DOOR = "smarthome/state/door";
const char *TOPIC_STATE_MOTION = "smarthome/state/motion";
const char *TOPIC_STATE_ONLINE = "smarthome/state/online";