# MQTT contract

## 1. ESP32 connection

| Item | Value | Note |
|---|---|---|
| Protocol | MQTT 3.1.1 over TCP, QoS 0, UTF-8 | No SSL, no username/password |
| Broker | `MQTT_BROKER`:`MQTT_PORT` from `src/config.cpp` | Phone, ESP32 and broker must share the LAN |
| Client id | `ESP32_SmartHome_Core` | Other clients must not reuse it |
| Session | Clean session, Keep Alive 30 s | Reconnect retried every 5 s |
| Last Will | `OFFLINE`, retained, on `smarthome/state/online` | Published by the broker when the connection drops |
| On connect | Publishes `ONLINE`, re-subscribes to both `cmd` topics | — |
| Initial state | Devices publish state once at boot, after the broker connects (`setup()` waits up to 15 s) | Not republished after a broker restart — retained values go stale until the next change |
| Subscriptions | `smarthome/cmd/light`, `smarthome/cmd/door` | Subscribed individually, no wildcard |

## 2. Commands — App → ESP32, retain false

Plain uppercase string, no quotes, no whitespace. Invalid payloads are ignored, logged, and leave the device state unchanged.

| Topic | Payload | Note |
|---|---|---|
| `smarthome/cmd/light` | `ON` | — |
| `smarthome/cmd/light` | `OFF` | — |
| `smarthome/cmd/door` | `OPEN` | Servo to 180° |
| `smarthome/cmd/door` | `CLOSE` | Servo to 0° — command is `CLOSE`, the matching state is `CLOSED` |

Retain false is deliberate: a reconnect must not re-execute an old command.

## 3. States — ESP32 → App, retain true

Plain uppercase string. Retained so a freshly subscribed app instantly sees the last known truth.

| Topic | Payload | Note |
|---|---|---|
| `smarthome/state/light` | `ON` | Published on every accepted change |
| `smarthome/state/light` | `OFF` | — |
| `smarthome/state/door` | `OPEN` | Reflects the applied command — no position sensor |
| `smarthome/state/door` | `CLOSED` | — |
| `smarthome/state/motion` | `DETECTED` | Debounced 250 ms |
| `smarthome/state/motion` | `CLEAR` | — |
| `smarthome/state/online` | `ONLINE` | Published by ESP32 after connecting |
| `smarthome/state/online` | `OFFLINE` | Published by the broker via Last Will — may arrive late |

## 4. Events — ESP32 → App, retain false

One topic: `smarthome/event/access`, JSON, at most 128 bytes. Retain false: an old card swipe is never replayed; events missed while the app is offline are lost.

| Field | Type | Note |
|---|---|---|
| `uid` | string | Uppercase hex, no separators — `"A1B2C3D4"` |
| `result` | string | `GRANTED` (card whitelisted) or `DENIED` |

Messages missing either field must be dropped by the app. `GRANTED` does not mean the door is open — read `smarthome/state/door` for actual state.
