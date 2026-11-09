# Smart Home Web Service & MQTT Test Center

Standardized modular web service to test MQTT commands, observe live telemetry stream (`smarthome/logs` & `smarthome/cmd`) and automate reactions with the **Rules Engine**.

## Architecture

```
server/
├── config.py                 # Central configuration (Broker, Ports, Topics, Rules file)
├── main.py                   # Service entrypoint, argument parsing, graceful shutdown
├── run.sh                    # Startup helper script
├── requirements.txt          # Python dependencies (paho-mqtt, rich)
├── data/
│   └── rules.json            # Persisted rules (auto-created, survives restarts)
├── services/
│   ├── log_store.py          # Thread-safe log buffering, SSE subscribers & listeners
│   ├── mqtt_service.py       # Paho MQTT connection, subscriptions & command publishing
│   └── rule_engine.py        # Rule evaluation engine (conditions -> actions)
├── controllers/
│   └── api_controller.py     # HTTP route handlers (API, SSE stream, static files)
├── templates/
│   ├── index.html            # Dashboard HTML markup
│   └── rules.html            # Rules Engine page markup
└── static/
    ├── css/
    │   └── style.css         # Clean, simple styling
    └── js/
        ├── app.js            # Front-end SSE listener, command sender & log rendering
        └── rules.js          # Rule builder UI, CRUD calls & trigger history
```

## How to Run

From the project root:

```bash
# Using the helper script:
./server/run.sh

# Or directly with python:
python3 server/main.py

# Optional parameters:
python3 server/main.py --broker 192.168.2.6 --port 1883 --web-port 5000
```

Open your browser at:
**`http://localhost:5000`** (Dashboard) or **`http://localhost:5000/rules`** (Rules Engine)

## Rules Engine

Every incoming MQTT message (log or command) is evaluated against all enabled rules.
A rule fires when the trigger match and its conditions pass, then executes one or more actions.

### Rule Schema

```json
{
  "name": "High temperature alert",
  "enabled": true,
  "cooldownSec": 30,
  "match": { "device": "MOTION_SENSOR", "id": null },
  "logic": "AND",
  "conditions": [
    { "field": "data.temperature", "operator": "gt", "value": "30" }
  ],
  "actions": [
    { "type": "command", "device": "LIGHT", "id": 1, "action": "ON", "data": {} },
    { "type": "notify", "message": "Temperature above 30°C!" },
    { "type": "webhook", "url": "http://example.com/hook", "payload": {} }
  ]
}
```

- **match**: pre-filter on `device` / `id` (empty / `null` = any).
- **conditions**: dotted field paths (`device`, `id`, `action`, `topic`, `success`, `data`, `data.*`).
  Operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `not_contains`, `exists`, `not_exists`.
  Combined with `logic`: `AND` (all) or `OR` (any). No conditions = always matches.
- **actions**: `command` (publish to `smarthome/cmd`), `notify` (inject SYSTEM event into the log stream) and/or `webhook` (async HTTP POST with rule context). Multiple actions allowed.
- **cooldownSec**: minimum seconds between two triggers of the same rule (anti-spam).

### HTTP API

| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | `/api/rules`             | List all rules                           |
| POST   | `/api/rules`             | Create a rule (validated)                |
| PUT    | `/api/rules/{id}`        | Update a rule                            |
| DELETE | `/api/rules/{id}`        | Delete a rule                            |
| POST   | `/api/rules/{id}/toggle` | Toggle enabled/disabled                  |
| POST   | `/api/rules/test`        | Dry-run `{rule, sample}` - no side effects |
| GET    | `/api/rules/events`      | Recent trigger events (newest first)     |
