#include "network.h"
#include <WiFi.h>

static const char *wifiSsid = nullptr;
static const char *wifiPassword = nullptr;
static bool wifiConnected = false;
static unsigned long lastWifiAttempt = 0;

// Handle WiFi events (M1-03)
static void WiFiEvent(WiFiEvent_t event)
{
  switch (event)
  {
  case ARDUINO_EVENT_WIFI_STA_START:
    Serial.println("=> WiFi module has started!");
    break;
  case ARDUINO_EVENT_WIFI_STA_CONNECTED:
    Serial.println("=> WiFi connected!");
    break;
  case ARDUINO_EVENT_WIFI_STA_GOT_IP:
    Serial.print("=> Got IP: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
    break;
  case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
    Serial.println("=> WiFi disconnected!");
    wifiConnected = false;
    break;
  default:
    break;
  }
}

void network_begin(const char *ssid, const char *password)
{
  wifiSsid = ssid;
  wifiPassword = password;

  WiFi.onEvent(WiFiEvent);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid, wifiPassword);
}

void network_loop()
{
  // Automatically reconnect WiFi if disconnected
  if (!wifiConnected && millis() - lastWifiAttempt > 5000)
  {
    Serial.println("Attempting WiFi connection...");
    WiFi.disconnect();
    WiFi.begin(wifiSsid, wifiPassword);
    lastWifiAttempt = millis();
  }
}

bool network_connected()
{
  return wifiConnected;
}
