#!/usr/bin/env python3
"""
Smart Home MQTT Test Server & Web Service
Entrypoint for launching the server.
"""

import argparse
import sys
from http.server import HTTPServer
from socketserver import ThreadingMixIn

from config import Config
from services.log_store import LogStore
from services.mqtt_service import MqttService
from services.rule_engine import RuleEngine
from controllers.api_controller import ApiController

try:
    from rich.console import Console
    console = Console()
    HAS_RICH = True
except ImportError:
    console = None
    HAS_RICH = False


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Multi-threaded HTTP Server for handling concurrent requests and SSE streams."""
    daemon_threads = True


def parse_args():
    parser = argparse.ArgumentParser(description="Smart Home MQTT Test Web Service")
    parser.add_argument(
        "--broker", "-b",
        default=Config.BROKER_HOST,
        help=f"MQTT Broker host (default: {Config.BROKER_HOST})"
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=Config.BROKER_PORT,
        help=f"MQTT Broker port (default: {Config.BROKER_PORT})"
    )
    parser.add_argument(
        "--web-port", "-w",
        type=int,
        default=Config.WEB_PORT,
        help=f"Web server port (default: {Config.WEB_PORT})"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Update config with CLI values
    Config.BROKER_HOST = args.broker
    Config.BROKER_PORT = args.port
    Config.WEB_PORT = args.web_port

    if HAS_RICH and console:
        console.print("[bold blue]============================================[/bold blue]")
        console.print("[bold blue]🏠 Starting Smart Home Web Service[/bold blue]")
        console.print(f"MQTT Broker: [cyan]{Config.BROKER_HOST}:{Config.BROKER_PORT}[/cyan]")
        console.print(f"Web Dashboard: [bold green]http://localhost:{Config.WEB_PORT}[/bold green]")
        console.print("[bold blue]============================================[/bold blue]\n")
    else:
        print("============================================")
        print("🏠 Starting Smart Home Web Service")
        print(f"MQTT Broker: {Config.BROKER_HOST}:{Config.BROKER_PORT}")
        print(f"Web Dashboard: http://localhost:{Config.WEB_PORT}")
        print("============================================\n")

    # 1. Initialize Services
    log_store = LogStore(max_history=Config.MAX_LOG_HISTORY)
    mqtt_service = MqttService(
        log_store=log_store,
        broker_host=Config.BROKER_HOST,
        broker_port=Config.BROKER_PORT
    )
    rule_engine = RuleEngine(
        mqtt_service=mqtt_service,
        log_store=log_store,
        rules_file=Config.RULES_FILE,
        max_events=Config.MAX_RULE_EVENTS
    )

    # 2. Inject dependencies into Controller
    ApiController.log_store = log_store
    ApiController.mqtt_service = mqtt_service
    ApiController.rule_engine = rule_engine

    # 3. Evaluate every incoming log against the rules
    log_store.add_listener(rule_engine.handle_log)

    # 4. Start MQTT loop in background
    mqtt_service.start()

    # 5. Start HTTP Server
    server_address = (Config.WEB_HOST, Config.WEB_PORT)
    httpd = ThreadedHTTPServer(server_address, ApiController)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nGracefully shutting down web service...")
    finally:
        mqtt_service.stop()
        httpd.server_close()
        print("Service stopped.")


if __name__ == "__main__":
    main()
