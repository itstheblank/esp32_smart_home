# MQTT contract

## 1. ESP32 connection

| Item | Value | Note |
|---|---|---|
| Protocol | MQTT 3.1.1 over TCP, QoS 0, UTF-8 | No SSL, no username/password |
| Broker | `MQTT_BROKER`:`MQTT_PORT` from `src/config.cpp` | Phone, ESP32 and broker must share the LAN |
| Client id | `ESP32_SmartHome_Core` | Other clients must not reuse it |
| Session | Clean session, Keep Alive 30 s | Reconnect retried every 5 s |
| Last Will | `{"device":"SYSTEM","id":0,"action":"OFFLINE","success":true,"data":{}}`, retained false, on `smarthome/logs` | Published by broker when connection drops unexpectedly |
| On connect | Publishes `ONLINE` log, re-subscribes to command topics | — |
| Subscriptions | `smarthome/cmd` | Single command topic |

---

## 2. Commands — App → ESP32, retain false

All commands are published to **`smarthome/cmd`** as JSON objects.

> **Retain = false**: A reconnect must not re-execute an old command.

### 2.1 JSON Schema

Every command published to `smarthome/cmd` follows this general schema:

```json
{
  "device": "<string>",
  "id": <integer>,
  "action": "<string>",
  "data": <object>
}
```

#### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `device` | string | Yes | Target device type (e.g. `"LIGHT"`, `"DOOR"`) |
| `id` | integer | Yes | Hardware unit instance identifier |
| `action` | string | Yes | Action to perform (e.g. `"ON"`, `"OFF"`, `"OPEN"`, `"CLOSE"`) |
| `data` | object | No | Optional contextual parameters (`{}` by default) |

#### Error Handling
If a command contains invalid JSON, an unknown `device` or `id`, or an unsupported `action`:
- The command is rejected and device state remains unchanged.
- A failure log is published to `smarthome/logs` with `"success": false`:
  ```json
  {"device":"<device>","id":<id>,"action":"<action>","success":false,"data":{}}
  ```

### 2.2 Examples

#### Light ON
```json
{
  "device": "LIGHT",
  "id": 1,
  "action": "ON",
  "data": {}
}
```

#### Door OPEN
```json
{
  "device": "DOOR",
  "id": 1,
  "action": "OPEN",
  "data": {}
}
```

---

## 3. Logs — ESP32 → App / Broker, retain false

All device state changes and discrete events are published to **`smarthome/logs`** as JSON objects.

> **Retain = false**: `smarthome/logs` is an event stream. Retain must NOT be set to `true`.

### 3.1 JSON Schema

Every message published to `smarthome/logs` follows this general schema:

```json
{
  "device": "<string>",
  "id": <integer>,
  "action": "<string>",
  "success": <boolean>,
  "data": <object>
}
```

#### Field Definitions

| Field | Type | Description |
|---|---|---|
| `device` | string | Target device identifier or type (e.g. `"LIGHT"`, `"RFID_READER"`, `"SYSTEM"`) |
| `id` | integer | Hardware unit instance identifier (`0` for system) |
| `action` | string | Action performed or event triggered |
| `success` | boolean | Outcome status of the action/event (`true` or `false`) |
| `data` | object | Contextual data payload (`{}` if no additional data is required) |

#### The `data` Field
The `data` object provides structured context when an event requires extra parameters:
- For devices with structured event data (such as RFID readers mirroring `RfidReaderEventData`), `data` includes relevant fields such as:
  ```json
  "data": {
    "tagId": "<hex-string>",
    "tagLen": <integer>
  }
  ```
- For actions/events without extra metadata, `data` is an empty object: `{}`.

---

### 3.2 Examples

#### Standard Action Log
```json
{
  "device": "LIGHT",
  "id": 1,
  "action": "ON",
  "success": true,
  "data": {}
}
```

#### Event Log with Context Data (RFID Reader)
```json
{
  "device": "RFID_READER",
  "id": 1,
  "action": "RFID_TAG_DETECTED",
  "success": true,
  "data": {
    "tagId": "12345678",
    "tagLen": 8
  }
}
```

---

### 3.3 Buffer and Serialization Constraints
- Maximum JSON payload size is **192 bytes**.
- Payloads are serialized using static stack buffers to avoid heap fragmentation.
