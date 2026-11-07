#ifndef LOG_SERVICE_H
#define LOG_SERVICE_H

#include <stdint.h>
#include <stddef.h>

class LogService
{
public:
  static LogService &instance()
  {
    static LogService s_instance;
    return s_instance;
  }

  LogService(const LogService &) = delete;
  LogService &operator=(const LogService &) = delete;

  // Logs a generic device action/state (data defaults to "{}")
  bool logAction(const char *device, uint8_t id, const char *action, bool success, const char *dataJson = "{}");

  // Logs an RFID reader detection event mirroring RfidReaderEventData
  bool logRfid(uint8_t id, const uint8_t *tagId, uint8_t tagLen, bool success = true);

  // Logs a system-level lifecycle event (e.g. "ONLINE", "OFFLINE")
  bool logSystem(const char *action, bool success = true);

private:
  LogService() = default;
};

#endif // LOG_SERVICE_H
