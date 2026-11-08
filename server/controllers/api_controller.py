import json
import os
import queue
from http.server import BaseHTTPRequestHandler
from typing import TYPE_CHECKING

if False:
    from services.log_store import LogStore
    from services.mqtt_service import MqttService

class ApiController(BaseHTTPRequestHandler):
    """HTTP Request Handler routing requests to templates, static files, and APIs."""

    # Injected dependencies
    log_store = None
    mqtt_service = None
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def log_message(self, format, *args):
        # Silence default HTTP access logs in console to keep terminal output clean
        return

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        # 1. Main Dashboard
        if self.path in ("/", "/index.html"):
            template_path = os.path.join(self.base_dir, "templates", "index.html")
            self._serve_file(template_path, "text/html; charset=utf-8")

        # 2. Static Assets (CSS, JS)
        elif self.path.startswith("/static/"):
            rel_path = self.path.removeprefix("/static/")
            file_path = os.path.join(self.base_dir, "static", rel_path)
            content_type = "text/plain"
            if file_path.endswith(".css"):
                content_type = "text/css"
            elif file_path.endswith(".js"):
                content_type = "application/javascript"
            self._serve_file(file_path, content_type)

        # 3. API: Broker Info
        elif self.path == "/api/info":
            info = {
                "broker": self.mqtt_service.broker_host,
                "port": self.mqtt_service.broker_port,
                "connected": self.mqtt_service.connected
            }
            self._send_json(200, info)

        # 4. API: Logs History
        elif self.path.startswith("/api/logs"):
            logs = self.log_store.get_logs()
            self._send_json(200, logs)

        # 5. API: Server-Sent Events (SSE) Stream
        elif self.path == "/api/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            q = self.log_store.subscribe()
            try:
                while True:
                    try:
                        msg = q.get(timeout=15.0)
                        data_str = f"data: {json.dumps(msg)}\n\n"
                        self.wfile.write(data_str.encode("utf-8"))
                        self.wfile.flush()
                    except queue.Empty:
                        # Keep-alive heartbeat comment
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                self.log_store.unsubscribe(q)

        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        # 1. API: Command Dispatch
        if self.path == "/api/cmd":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                req = json.loads(body)

                device = req.get("device", "LIGHT")
                device_id = int(req.get("id", 1))
                action = req.get("action", "ON")
                data = req.get("data", {})

                ok = self.mqtt_service.send_command(device, device_id, action, data)
                if ok:
                    self._send_json(200, {"status": "ok"})
                else:
                    self._send_json(503, {"status": "failed", "message": "MQTT broker not connected"})
            except Exception as e:
                self._send_json(400, {"status": "error", "message": str(e)})

        # 2. API: Clear Logs
        elif self.path == "/api/clear":
            self.log_store.clear()
            self._send_json(200, {"status": "ok"})

        else:
            self._send_json(404, {"error": "Not Found"})

    def _serve_file(self, file_path: str, content_type: str):
        if not os.path.exists(file_path):
            self._send_json(404, {"error": "File not found"})
            return
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
