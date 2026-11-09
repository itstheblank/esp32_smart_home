#!/usr/bin/env python3
"""Periodically toggle the relay (LIGHT) and servo (DOOR) via MQTT.

Publishes compact JSON commands to `smarthome/cmd` (contract v1.0.0, §2):
- LIGHT id 1: ON <-> OFF every interval (default 1 s),
- DOOR  id 1: OPEN <-> CLOSE every interval (default 1 s).

Commands are QoS 0, retain false. Ctrl+C publishes DISCONNECT and exits.
Uses only Python's standard library, speaking the MQTT 3.1.1 wire format
directly (same minimal client as fake_esp32.py).
"""

import argparse
from contextlib import ExitStack, suppress
from datetime import datetime
import json
import socket
import struct
import sys
import time


TOPIC_CMD = "smarthome/cmd"


class MQTTError(Exception):
    """A broker packet did not satisfy the MQTT 3.1.1 contract."""


def utf8_field(value):
    encoded = value.encode("utf-8")
    return struct.pack("!H", len(encoded)) + encoded


def packet(header, body):
    remaining = len(body)
    length = bytearray()
    while True:
        digit = remaining % 128
        remaining //= 128
        length.append(digit | (0x80 if remaining else 0))
        if not remaining:
            return bytes([header]) + bytes(length) + body


def connect_broker(stack, host, port, client_id, timeout):
    sock = stack.enter_context(socket.create_connection((host, port), timeout))
    body = utf8_field("MQTT") + b"\x04\x02" + struct.pack("!H", 0) + utf8_field(client_id)
    send_packet(sock, 0x10, body, timeout)  # CONNECT, clean session, keep alive 0
    header, ack = read_packet(sock, timeout)
    if header != 0x20 or len(ack) != 2:
        raise MQTTError(f"Expected CONNACK, received header 0x{header:02x}, body {ack!r}")
    if ack[1]:
        raise MQTTError(f"CONNECT rejected by broker (code {ack[1]})")
    return sock


def read_exact(sock, count, deadline):
    result = bytearray()
    while len(result) < count:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("Timed out waiting for a complete MQTT packet")
        sock.settimeout(remaining)
        chunk = sock.recv(count - len(result))
        if not chunk:
            raise MQTTError("Broker closed the connection before the packet completed")
        result.extend(chunk)
    return bytes(result)


def read_packet(sock, timeout):
    deadline = time.monotonic() + timeout
    header = read_exact(sock, 1, deadline)[0]
    remaining = 0
    for index in range(4):
        digit = read_exact(sock, 1, deadline)[0]
        remaining += (digit & 0x7F) * (128 ** index)
        if not digit & 0x80:
            break
    else:
        raise MQTTError("Invalid MQTT Remaining Length: more than four bytes")
    return header, read_exact(sock, remaining, deadline)


def send_packet(sock, header, body, timeout):
    sock.settimeout(timeout)
    sock.sendall(packet(header, body))


def publish(sock, topic, payload, timeout):
    send_packet(sock, 0x30, utf8_field(topic) + payload, timeout)  # QoS 0, retain false


def command(device, device_id, action):
    payload = json.dumps({"device": device, "id": device_id, "action": action, "data": {}},
                         separators=(",", ":"))
    return payload.encode("utf-8")


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def run(args, sock):
    log(f"connected to {args.host}:{args.port} as {args.client_id!r}; "
        f"toggling LIGHT and DOOR on {TOPIC_CMD} every {args.interval:g}s"
        + (f" for {args.count} ticks" if args.count else " until Ctrl+C"))

    light_payloads = (command("LIGHT", args.light_id, "ON"), command("LIGHT", args.light_id, "OFF"))
    door_payloads = (command("DOOR", args.door_id, "OPEN"), command("DOOR", args.door_id, "CLOSE"))

    next_tick = time.monotonic()
    tick = 0
    while True:
        if args.count and tick >= args.count:
            log(f"finished {args.count} ticks")
            break
        light_payload = light_payloads[tick % 2]
        door_payload = door_payloads[tick % 2]
        publish(sock, TOPIC_CMD, light_payload, args.timeout)
        publish(sock, TOPIC_CMD, door_payload, args.timeout)
        log(f"tick {tick}: {light_payload.decode()} | {door_payload.decode()}")
        tick += 1
        next_tick += args.interval
        delay = next_tick - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        elif delay < -args.interval:
            next_tick = time.monotonic()  # fell far behind (suspended); resync


def port_number(value):
    number = int(value)
    if not 1 <= number <= 65535:
        raise argparse.ArgumentTypeError("port must be between 1 and 65535")
    return number


def timeout_seconds(value):
    number = float(value)
    if not 0 < number < float("inf"):
        raise argparse.ArgumentTypeError("timeout must be a positive finite number")
    return number


def positive_interval(value):
    number = float(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("interval must be positive")
    return number


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="broker address (default: 127.0.0.1)")
    parser.add_argument("--port", type=port_number, default=1883)
    parser.add_argument("--client-id", default="PeriodicToggle_Test",
                        help="client id; must never be ESP32_SmartHome_Core")
    parser.add_argument("--interval", type=positive_interval, default=1.0,
                        help="seconds between toggles (default: 1)")
    parser.add_argument("--count", type=int, default=0,
                        help="stop after this many ticks; 0 runs forever (default: 0)")
    parser.add_argument("--light-id", type=int, default=1, help="LIGHT device id (default: 1)")
    parser.add_argument("--door-id", type=int, default=1, help="DOOR device id (default: 1)")
    parser.add_argument("--timeout", type=timeout_seconds, default=5.0,
                        help="seconds per packet (default: 5)")
    args = parser.parse_args()

    try:
        with ExitStack() as stack:
            sock = connect_broker(stack, args.host, args.port, args.client_id, args.timeout)
            try:
                run(args, sock)
            finally:
                with suppress(OSError):
                    send_packet(sock, 0xE0, b"", args.timeout)  # DISCONNECT
    except KeyboardInterrupt:
        log("Ctrl+C — disconnecting")
        return 0
    except (OSError, MQTTError, TimeoutError, ValueError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        if isinstance(exc, ConnectionRefusedError):
            print("Check that EMQX is running and MQTT TCP port 1883 is published.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
