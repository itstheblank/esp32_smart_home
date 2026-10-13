#!/usr/bin/env python3
"""Check the four current smart-home commands through an MQTT 3.1.1 broker.

Uses only Python's standard library. Commands use QoS 0, Retain off, and
exact payload bytes without a trailing newline. No ESP32 is required.
"""

import argparse
from contextlib import ExitStack, suppress
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import socket
import struct
import sys
import time
import uuid


COMMANDS = (
    ("smarthome/cmd/light", b"ON"),
    ("smarthome/cmd/light", b"OFF"),
    ("smarthome/cmd/door", b"OPEN"),
    ("smarthome/cmd/door", b"CLOSE"),
)
SAIGON = timezone(timedelta(hours=7))


class MQTTError(Exception):
    """A broker packet did not satisfy the smoke-test contract."""


def timestamp():
    return datetime.now(SAIGON).isoformat(timespec="seconds")


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
    if remaining > 1024 * 1024:
        raise MQTTError("Unexpected MQTT packet larger than 1 MiB")
    return header, read_exact(sock, remaining, deadline)


def send_packet(sock, header, body, timeout):
    sock.settimeout(timeout)
    sock.sendall(packet(header, body))


def connect_client(stack, host, port, client_id, timeout):
    sock = stack.enter_context(socket.create_connection((host, port), timeout))
    # MQTT 3.1.1, Clean Session, no authentication, Keep Alive disabled.
    connect_body = utf8_field("MQTT") + b"\x04\x02\x00\x00" + utf8_field(client_id)
    send_packet(sock, 0x10, connect_body, timeout)
    header, body = read_packet(sock, timeout)
    if header != 0x20 or len(body) != 2:
        raise MQTTError(f"Expected CONNACK, received header 0x{header:02x}, body {body!r}")
    if body[1]:
        reasons = {
            1: "unsupported MQTT version",
            2: "client ID rejected",
            3: "broker unavailable",
            4: "username/password rejected",
            5: "not authorized",
        }
        raise MQTTError(f"CONNECT rejected: {reasons.get(body[1], 'unknown code')} ({body[1]})")
    if body[0] != 0:
        raise MQTTError("CONNACK has unexpected flags for a clean session")
    return sock


def subscribe(sock, timeout):
    packet_id = 1
    body = struct.pack("!H", packet_id) + utf8_field("smarthome/cmd/+") + b"\x00"
    send_packet(sock, 0x82, body, timeout)
    header, response = read_packet(sock, timeout)
    expected = struct.pack("!H", packet_id) + b"\x00"
    if header != 0x90 or response != expected:
        raise MQTTError(f"Expected SUBACK for packet ID 1 with QoS 0; got 0x{header:02x}, {response!r}")


def receive_command(sock, expected_topic, expected_payload, timeout):
    header, body = read_packet(sock, timeout)
    if header != 0x30:
        raise MQTTError(f"Expected QoS 0 PUBLISH with Retain off; received header 0x{header:02x}")
    if len(body) < 2:
        raise MQTTError("PUBLISH packet has no topic length")
    topic_length = struct.unpack("!H", body[:2])[0]
    if not topic_length or len(body) < 2 + topic_length:
        raise MQTTError("PUBLISH packet has an invalid topic length")
    try:
        topic = body[2:2 + topic_length].decode("utf-8")
    except UnicodeDecodeError as exc:
        raise MQTTError("PUBLISH topic is not valid UTF-8") from exc
    payload = body[2 + topic_length:]
    if topic != expected_topic or payload != expected_payload:
        raise MQTTError(
            f"Expected {expected_topic} -> {expected_payload!r}; received {topic} -> {payload!r}. "
            "Check other publishers or retained commands. Payloads must have no extra whitespace."
        )


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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="broker address (default: 127.0.0.1)")
    parser.add_argument("--port", type=port_number, default=1883)
    parser.add_argument("--timeout", type=timeout_seconds, default=5.0, help="seconds per packet (default: 5)")
    parser.add_argument("--output", type=Path, help="optional JSON report path")
    args = parser.parse_args()
    report = {
        "started_at": timestamp(),
        "broker": {"host": args.host, "port": args.port},
        "mqtt_version": "3.1.1",
        "subscription": "smarthome/cmd/+",
        "status": "FAIL",
        "tests": [],
    }
    try:
        with ExitStack() as stack:
            run_id = uuid.uuid4().hex[:12]
            observer = connect_client(stack, args.host, args.port, "m5obs" + run_id, args.timeout)
            subscribe(observer, args.timeout)
            sender = connect_client(stack, args.host, args.port, "m5send" + run_id, args.timeout)
            for index, (topic, payload) in enumerate(COMMANDS, 1):
                result = {"topic": topic, "payload": payload.decode("ascii"), "qos": 0, "retain": False, "status": "FAIL"}
                report["tests"].append(result)
                send_packet(sender, 0x30, utf8_field(topic) + payload, args.timeout)
                receive_command(observer, topic, payload, args.timeout)
                result["status"] = "PASS"
                print(f"PASS {index}/4: {topic} -> {payload.decode('ascii')}")
            report["status"] = "PASS"
            # Let the broker release these diagnostic clients immediately.
            for client in (sender, observer):
                with suppress(OSError):
                    send_packet(client, 0xE0, b"", args.timeout)
    except (OSError, MQTTError) as exc:
        report["status"] = "FAIL"
        report["error"] = str(exc)
        print(f"FAIL: {exc}", file=sys.stderr)
        if isinstance(exc, ConnectionRefusedError):
            print("Check that EMQX is running and MQTT TCP port 1883 is published.", file=sys.stderr)
        elif isinstance(exc, socket.gaierror):
            print("Use a plain hostname or IP for --host, without mqtt://.", file=sys.stderr)
        elif isinstance(exc, TimeoutError):
            print("Check broker connectivity, firewall, and permission to subscribe/publish.", file=sys.stderr)
    report["finished_at"] = timestamp()
    passed = sum(test["status"] == "PASS" for test in report["tests"])
    print(f"Summary: {passed}/4 commands passed; {report['status']}")
    if args.output:
        try:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"Report: {args.output}")
        except OSError as exc:
            print(f"FAIL: could not write JSON report: {exc}", file=sys.stderr)
            return 1
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
