import json
from datetime import datetime
from typing import Optional, Dict, Any

try:
    import paho.mqtt.client as mqtt
except ImportError:
    raise ImportError("paho-mqtt is required. Run: pip install paho-mqtt")

try:
    from rich.console import Console
    console = Console()
    HAS_RICH = True
except ImportError:
    console = None
    HAS_RICH = False

from .log_store import LogStore
from config import Config

class MqttService:
    """Manages MQTT connections, subscriptions, and command dispatch."""

    def __init__(self, log_store: LogStore, broker_host: str = Config.BROKER_HOST, broker_port: int = Config.BROKER_PORT):
        self.log_store = log_store
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.connected = False

        if hasattr(mqtt, "CallbackAPIVersion"):
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=Config.CLIENT_ID)
        else:
            self.client = mqtt.Client(client_id=Config.CLIENT_ID)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

    def start(self) -> None:
        """Connects to the broker and starts the background network loop."""
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
        except Exception as e:
            print(f"WARNING: Could not connect to MQTT broker ({e}). Will keep retrying...")
        self.client.loop_start()

    def stop(self) -> None:
        """Stops the network loop and disconnects cleanly."""
        self.client.loop_stop()
        self.client.disconnect()

    def send_command(self, device: str, device_id: int, action: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Publishes a JSON command to smarthome/cmd (retain=False, qos=0)."""
        if not self.connected:
            return False

        payload = {
            "device": device,
            "id": int(device_id),
            "action": action,
            "data": data or {}
        }
        json_str = json.dumps(payload)
        info = self.client.publish(Config.TOPIC_CMD, json_str, qos=0, retain=False)
        return info.rc == mqtt.MQTT_ERR_SUCCESS

    def _on_connect(self, client, userdata, flags, rc, properties=None) -> None:
        if rc == 0:
            self.connected = True
            msg = f"Connected to MQTT Broker at {self.broker_host}:{self.broker_port}"
            if HAS_RICH and console:
                console.print(f"[bold green]✔ {msg}[/bold green]")
            else:
                print(f"✔ {msg}")

            # Subscribe to logs and commands
            client.subscribe([(Config.TOPIC_LOGS, 0), (Config.TOPIC_CMD, 0)])
            if HAS_RICH and console:
                console.print(f"[dim]Subscribed to '{Config.TOPIC_LOGS}' and '{Config.TOPIC_CMD}'[/dim]")
        else:
            self.connected = False
            print(f"MQTT connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None) -> None:
        self.connected = False
        print(f"Disconnected from MQTT broker (rc={rc})")

    def _on_message(self, client, userdata, msg) -> None:
        try:
            payload_str = msg.payload.decode("utf-8")
            try:
                parsed = json.loads(payload_str)
            except Exception:
                parsed = {"raw": payload_str}

            entry = {
                "time": datetime.now().strftime("%H:%M:%S"),
                "topic": msg.topic,
                "device": parsed.get("device", ""),
                "id": parsed.get("id", ""),
                "action": parsed.get("action", ""),
                "success": parsed.get("success", None),
                "data": parsed.get("data", {}),
                "raw": payload_str,
            }

            self._log_to_console(msg.topic, parsed, payload_str)
            self.log_store.add_log(entry)
        except Exception as e:
            print(f"Error processing MQTT message: {e}")

    def _log_to_console(self, topic: str, data: dict, raw_payload: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        if HAS_RICH and console:
            device = data.get("device", "-")
            dev_id = str(data.get("id", "-"))
            action = data.get("action", "-")
            success = data.get("success")
            extra_data = json.dumps(data.get("data", {})) if data.get("data") else ""

            if topic == Config.TOPIC_CMD:
                console.print(
                    f"[dim]{timestamp}[/dim] [bold blue][CMD][/bold blue] "
                    f"Device=[cyan]{device}[/cyan] ID={dev_id} Action=[yellow]{action}[/yellow] "
                    f"Data={extra_data}"
                )
            else:
                status_style = "green" if success is True else ("red" if success is False else "white")
                status_text = "OK" if success is True else ("FAIL" if success is False else "-")
                console.print(
                    f"[dim]{timestamp}[/dim] [bold green][LOG][/bold green] "
                    f"Device=[cyan]{device}[/cyan] ID={dev_id} Action=[yellow]{action}[/yellow] "
                    f"Status=[{status_style}]{status_text}[/{status_style}] "
                    f"Data={extra_data}"
                )
        else:
            print(f"[{timestamp}] [{topic}] {raw_payload}")
