#ifndef SENSOR_INTERFACE_H
#define SENSOR_INTERFACE_H

#include <Arduino.h>

// Interface dành riêng cho Member 2 (PIR Motion & RFID RC522)
// Member 2 chỉ cần gọi các hàm này, Core MQTT sẽ tự động đóng gói và publish lên broker

namespace SensorInterface
{
    void notifyMotionState(bool detected);

    void notifyRFIDAccess(const char *uid, bool isGranted);
}

#endif // SENSOR_INTERFACE_H