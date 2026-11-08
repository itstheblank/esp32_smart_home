# Smart Home Web Service & MQTT Test Center

Standardized modular web service to test MQTT commands and observe live telemetry stream (`smarthome/logs` & `smarthome/cmd`).

## Architecture

```
server/
├── config.py                 # Central configuration (Broker, Ports, Topics)
├── main.py                   # Service entrypoint, argument parsing, graceful shutdown
├── run.sh                    # Startup helper script
├── requirements.txt          # Python dependencies (paho-mqtt, rich)
├── services/
│   ├── log_store.py          # Thread-safe log buffering & SSE subscriber management
│   └── mqtt_service.py       # Paho MQTT connection, subscriptions & command publishing
├── controllers/
│   └── api_controller.py     # HTTP route handlers (API, SSE stream, static files)
├── templates/
│   └── index.html            # Dashboard HTML markup
└── static/
    ├── css/
    │   └── style.css         # Clean, simple styling
    └── js/
        └── app.js            # Front-end SSE listener, command sender & log rendering
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
**`http://localhost:5000`**
