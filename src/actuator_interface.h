#ifndef ACTUATOR_INTERFACE_H
#define ACTUATOR_INTERFACE_H

#include <Arduino.h>

// Interface cho Member 3 (Actuator: Relay & Servo)
// Member 1 gọi các hàm này khi nhận lệnh MQTT từ App
// Member 3 sẽ viết code điều khiển phần cứng thực tế bên trong các hàm này

namespace ActuatorInterface
{
    void init();

    bool setLight(bool turnOn);

    bool openDoor();

    bool closeDoor();
}

#endif // ACTUATOR_INTERFACE_H