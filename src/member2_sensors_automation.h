#ifndef MEMBER2_SENSORS_AUTOMATION_H
#define MEMBER2_SENSORS_AUTOMATION_H

#include <Arduino.h>
#include <MFRC522.h>
#include <PubSubClient.h>

class Member2SensorsAutomation
{
public:
  explicit Member2SensorsAutomation(PubSubClient &mqttClient);

  void begin();
  void update();
  void publishCurrentState();

  // Rule: a manual light command is applied immediately and cancels the
  // automation timer. Automation resumes only after the next stable PIR
  // transition, making the result deterministic for the app and demo.
  void handleManualLightCommand(bool on);

private:
  PubSubClient &_mqttClient;
  MFRC522 _rfid;
  bool _rawMotion;
  bool _stableMotion;
  bool _lightOn;
  bool _manualOverride;
  bool _waitingForNoMotionTimeout;
  unsigned long _rawMotionChangedAt;
  unsigned long _noMotionStartedAt;

  void updateMotion();
  void handleStableMotionTransition(bool detected);
  void updateRfid();
  bool isAuthorizedUid(const String &uid) const;
  void setLight(bool on, const char *source);
  void publishMotion();
  void publishAccessEvent(const String &uid, const char *result);
};

#endif
