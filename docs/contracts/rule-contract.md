# Rule contract

## 1. Schema

```json
{
  "id": 1,
  "name": "Motion turns light on",
  "description": "When stable motion is detected, switch the light on",
  "enabled": true,
  "trigger": {
    "type": "ChangedTo",
    "device": "motion",
    "field": "result",
    "value": "DETECTED",
    "stableMs": 10000
  },
  "actions": [
    { "device": "light", "command": "ON" }
  ]
}
```

## 2. Fields

| Field | Type / values | Meaning |
|---|---|---|
| `id` | integer, incremental | Rule identifier, assigned in declaration order (1, 2, 3, …), used in logs |
| `name` | string, short | Human-readable label shown in the app |
| `description` | string | One-line explanation of what the rule does and why |
| `enabled` | boolean | `false` — the engine ignores the rule entirely |
| `trigger` | object | What fires the rule — see §3 |
| `actions` | array, max 2 | What to do, executed in order — see §4 |

## 3. Trigger fields

| Field | Values | Meaning |
|---|---|---|
| `type` | `ChangedTo` | Fires once per state transition into `value`; the initial publish at boot is **not** a transition |
| | `IsForMs` | Fires once per continuous hold of `value` for `stableMs`; resets whenever the state leaves `value` |
| | `EventEquals` | Fires once per event occurrence whose `field` equals `value`; no replay, missed events are lost |
| `device` | `motion`, `rfid` | Source devices only |
| `field` | event field name | Only for `EventEquals` — e.g. `result` |
| `value` | string | State value (`DETECTED`, `CLEAR`) or event value (`GRANTED`, `DENIED`) |
| `stableMs` | integer, ms | Only for `IsForMs` |

## 4. Action fields

| Field | Values | Meaning |
|---|---|---|
| `device` | `light`, `door` | Sink devices only |
| `command` | `ON`, `OFF`, `OPEN`, `CLOSE` | Dispatched via the device's existing `handleCommand()`; invalid commands are dropped, state unchanged. Command vocabulary — `CLOSE`, never `CLOSED` |
| (limits) | `MAX_RULES = 8`, `MAX_ACTIONS_PER_RULE = 2` | Static caps — no dynamic allocation on the ESP32; rules firing in the same cycle execute in declaration order |

## 5. Built-in rules (example)

```json
[
  {
    "id": 1,
    "name": "Motion turns light on",
    "description": "When stable motion is detected, switch the light on",
    "enabled": true,
    "trigger": { "type": "ChangedTo", "device": "motion", "value": "DETECTED" },
    "actions": [ { "device": "light", "command": "ON" } ]
  },
  {
    "id": 2,
    "name": "No-motion timeout",
    "description": "Turn the light off after motion has been clear for a while",
    "enabled": true,
    "trigger": { "type": "IsForMs", "device": "motion", "value": "CLEAR", "stableMs": 10000 },
    "actions": [ { "device": "light", "command": "OFF" } ]
  },
  {
    "id": 3,
    "name": "RFID opens door",
    "description": "Open the door when a whitelisted card is presented",
    "enabled": true,
    "trigger": { "type": "EventEquals", "device": "rfid", "field": "result", "value": "GRANTED" },
    "actions": [ { "device": "door", "command": "OPEN" } ]
  }
]
```

- Rule 3 (`rfid-door-open`) is **protected**: compiled into the firmware, cannot be disabled or overridden by any dynamic rule. The engine must reject a dynamic rule whose action is `door` ← `OPEN` — otherwise any trigger could open the door and defeat the RFID whitelist.
- Rule 2 (`motion-light-off`) is **kept inside `LightAutomation` for now** — the manual-override interaction is not expressible as a plain rule yet.
