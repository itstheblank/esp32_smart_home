#ifndef RFID_LOGIC_H
#define RFID_LOGIC_H

#include <stddef.h>
#include <stdint.h>
#include <string.h>

// Pure logic — no Arduino.h, host-testable (docs/development.md)

// Access results per contract §2 (smarthome/event/access)
#define RFID_RESULT_GRANTED "GRANTED"
#define RFID_RESULT_DENIED "DENIED"

// Formats raw UID bytes as uppercase hex: {0xA1,0xB2,0xC3,0xD4} -> "A1B2C3D4".
// Needs outSize >= 2*len+1. Returns false and empties out on invalid input.
inline bool rfid_format_uid(const uint8_t *uid, uint8_t len, char *out, size_t outSize)
{
  if (out != nullptr && outSize > 0)
    out[0] = '\0';
  if (uid == nullptr || out == nullptr || len == 0 || outSize < (size_t)len * 2 + 1)
    return false;
  static const char hex[] = "0123456789ABCDEF";
  for (uint8_t i = 0; i < len; i++)
  {
    out[i * 2] = hex[uid[i] >> 4];
    out[i * 2 + 1] = hex[uid[i] & 0x0F];
  }
  out[len * 2] = '\0';
  return true;
}

// Exact, case-sensitive match against the whitelist (uids come from
// rfid_format_uid, so case is guaranteed). Null/empty uid or list -> DENIED.
inline const char *rfid_check_access(const char *uid, const char *const *whitelist, uint8_t count)
{
  if (uid == nullptr || uid[0] == '\0' || whitelist == nullptr)
    return RFID_RESULT_DENIED;
  for (uint8_t i = 0; i < count; i++)
    if (whitelist[i] != nullptr && strcmp(uid, whitelist[i]) == 0)
      return RFID_RESULT_GRANTED;
  return RFID_RESULT_DENIED;
}

#endif // RFID_LOGIC_H
