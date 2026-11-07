#ifndef COMMAND_DISPATCHER_H
#define COMMAND_DISPATCHER_H

#include "devices/actuators/light.h"
#include "devices/actuators/door.h"

class CommandDispatcher
{
public:
  static CommandDispatcher &instance()
  {
    static CommandDispatcher s_instance;
    return s_instance;
  }

  CommandDispatcher(const CommandDispatcher &) = delete;
  CommandDispatcher &operator=(const CommandDispatcher &) = delete;

  // Binds the actuators and registers the MQTT command subscription to TOPIC_CMD
  void begin(Light *light, Door *door);

  // Parses and routes incoming JSON commands from smarthome/cmd
  void dispatch(const char *payload, unsigned int length);

private:
  CommandDispatcher() = default;

  Light *light = nullptr;
  Door *door = nullptr;
};

#endif // COMMAND_DISPATCHER_H
