#include <SPI.h>
#include "actuator_bridge.h"
#include "config.h"
#include "member2_sensors_automation.h"

Member2SensorsAutomation::Member2SensorsAutomation(PubSubClient &mqttClient)
    : _mqttClient(mqttClient), _rfid(RFID_SS_PIN, RFID_RST_PIN), _rawMotion(false),
      _stableMotion(false), _lightOn(false), _manualOverride(false),
      _waitingForNoMotionTimeout(false), _rawMotionChangedAt(0), _noMotionStartedAt(0)
{
}

void Member2SensorsAutomation::begin()
{
  pinMode(PIR_PIN, INPUT);
  _rawMotion = digitalRead(PIR_PIN) == HIGH;
  _stableMotion = _rawMotion;
  _rawMotionChangedAt = millis();

  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  _rfid.PCD_Init();
  Serial.printf("[M2] PIR GPIO %u initial=%s; RC522 initialized (SS=%u, RST=%u)\n",
                PIR_PIN, _stableMotion ? "DETECTED" : "CLEAR", RFID_SS_PIN, RFID_RST_PIN);
}

void Member2SensorsAutomation::update()
{
  updateMotion();
  updateRfid();
}

void Member2SensorsAutomation::handleManualLightCommand(bool on)
{
  Serial.printf("[M2] Manual light command -> %s; automation paused until next PIR transition\n", on ? "ON" : "OFF");
  _manualOverride = true;
  _waitingForNoMotionTimeout = false;
  setLight(on, "manual MQTT command");
}

void Member2SensorsAutomation::updateMotion()
{
  const bool sampledMotion = digitalRead(PIR_PIN) == HIGH;
  const unsigned long now = millis();
  if (sampledMotion != _rawMotion)
  {
    _rawMotion = sampledMotion;
    _rawMotionChangedAt = now;
  }

  if (_rawMotion != _stableMotion && now - _rawMotionChangedAt >= PIR_STABLE_MS)
  {
    _stableMotion = _rawMotion;
    handleStableMotionTransition(_stableMotion);
  }

  if (_waitingForNoMotionTimeout && now - _noMotionStartedAt >= MOTION_NO_MOTION_TIMEOUT_MS)
  {
    _waitingForNoMotionTimeout = false;
    if (!_manualOverride)
      setLight(false, "no-motion timeout");
  }
}

void Member2SensorsAutomation::handleStableMotionTransition(bool detected)
{
  Serial.printf("[M2] PIR stable state -> %s\n", detected ? "DETECTED" : "CLEAR");
  publishMotion();

  // A new physical PIR transition explicitly returns control to automation.
  _manualOverride = false;
  if (detected)
  {
    _waitingForNoMotionTimeout = false;
    setLight(true, "motion detected");
  }
  else
  {
    _waitingForNoMotionTimeout = true;
    _noMotionStartedAt = millis();
    Serial.printf("[M2] No-motion timer started (%lums)\n", MOTION_NO_MOTION_TIMEOUT_MS);
  }
}

void Member2SensorsAutomation::updateRfid()
{
  if (!_rfid.PICC_IsNewCardPresent() || !_rfid.PICC_ReadCardSerial())
    return;

  String uid;
  for (byte i = 0; i < _rfid.uid.size; ++i)
  {
    if (_rfid.uid.uidByte[i] < 0x10)
      uid += '0';
    uid += String(_rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  const bool authorized = isAuthorizedUid(uid);
  Serial.printf("[M2] RFID UID=%s -> %s\n", uid.c_str(), authorized ? "GRANTED" : "DENIED");
  if (authorized)
  {
    if (actuator::openDoor())
    {
      if (_mqttClient.connected())
        _mqttClient.publish(TOPIC_STATE_DOOR, "OPEN", true);
    }
    else
    {
      Serial.println("[M2] Door bridge reported failure; physical door was not opened.");
    }
  }
  publishAccessEvent(uid, authorized ? "GRANTED" : "DENIED");

  _rfid.PICC_HaltA();
  _rfid.PCD_StopCrypto1();
}

bool Member2SensorsAutomation::isAuthorizedUid(const String &uid) const
{
  for (size_t i = 0; i < RFID_ALLOWED_UID_COUNT; ++i)
    if (uid == RFID_ALLOWED_UIDS[i])
      return true;
  return false;
}

void Member2SensorsAutomation::setLight(bool on, const char *source)
{
  if (!actuator::setLight(on))
  {
    Serial.printf("[M2] Light bridge failed; keeping previous state (%s)\n", _lightOn ? "ON" : "OFF");
    return;
  }
  _lightOn = on;
  Serial.printf("[M2] Light state -> %s (%s)\n", on ? "ON" : "OFF", source);
  if (_mqttClient.connected())
    _mqttClient.publish(TOPIC_STATE_LIGHT, on ? "ON" : "OFF", true);
}

void Member2SensorsAutomation::publishMotion()
{
  if (_mqttClient.connected())
    _mqttClient.publish(TOPIC_STATE_MOTION, _stableMotion ? "DETECTED" : "CLEAR", true);
}

void Member2SensorsAutomation::publishAccessEvent(const String &uid, const char *result)
{
  if (!_mqttClient.connected())
  {
    Serial.println("[M2] MQTT offline; access event cannot be queued.");
    return;
  }
  const String payload = String("{\"uid\":\"") + uid + "\",\"result\":\"" + result + "\"}";
  _mqttClient.publish(TOPIC_EVENT_ACCESS, payload.c_str(), false);
}

void Member2SensorsAutomation::publishCurrentState()
{
  if (!_mqttClient.connected())
    return;
  _mqttClient.publish(TOPIC_STATE_MOTION, _stableMotion ? "DETECTED" : "CLEAR", true);
  _mqttClient.publish(TOPIC_STATE_LIGHT, _lightOn ? "ON" : "OFF", true);
}
