#!/usr/bin/env python3
"""Fake ESP32 smart-home device for integration tests without hardware.

Implements contract v1.0.0 (docs/mqtt-contract.json):
- connects with client id FakeESP32_Test (never ESP32_SmartHome_Core),
- registers the Last Will OFFLINE/retained on smarthome/state/online,
- publishes ONLINE (retained) after connecting,
- subscribes smarthome/cmd/+, validates payloads against the contract,
  publishes the matching retained state (CLOSE -> CLOSED) only for valid
  commands; invalid or unknown commands are logged and ignored,
- on Ctrl+C publishes OFFLINE (retained) before DISCONNECT (contract §4.7);
  on SIGKILL the broker publishes the LWT instead.

--replay FILE re-sends a recorded message trace. The file is a JSON list of
entries like {"topic": "smarthome/state/door", "payload": "OPEN",
"retain": true, "delay_ms": 250} (retain/delay_ms optional).

Uses only Python's standard library, same wire format as mqtt_smoke_test.py.
"""

import argparse
from contextlib import ExitStack, suppress
from datetime import datetime
import json
from pathlib import Path
import socket
import struct
import sys
import time
import uuid


CONTRACT_PATH = Path(__file__).resolve().parents[1] / "docs" / "mqtt-contract.json"

# Contract §3: the CLOSE command maps to the CLOSED state payload.
PAYLOAD_ALIASES = {"CLOSE": "CLOSED"}


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


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def load_contract():
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))


def build_command_map(contract):
    """cmd topic -> state topic + allowed payloads, straight from the contract."""
    states = {t["topic"]: t for t in contract["topics"] if t["type"] == "state"}
    mapping = {}
    for entry in contract["topics"]:
        if entry["type"] != "command":
            continue
        state_topic = entry["topic"].replace("/cmd/", "/state/", 1)
        state = states.get(state_topic)
        if state is None:
            continue
        mapping[entry["topic"]] = {
            "payloads": {p.encode("utf-8") for p in entry["payloads"]},
            "state_topic": state_topic,
            "state_payloads": {p.encode("utf-8") for p in state["payloads"]},
            "state_retain": state["retain"],
        }
    return mapping


def connect_broker(stack, host, port, client_id, timeout, will=None, keep_alive=0):
    sock = stack.enter_context(socket.create_connection((host, port), timeout))
    flags = 0x02  # clean session
    body = utf8_field("MQTT") + b"\x04"
    if will is not None:
        # will flag (0x04) + will QoS 0 (0) + will retain (0x20)
        flags |= 0x04 | 0x20
        body += bytes([flags]) + struct.pack("!H", keep_alive)
        body += utf8_field(client_id) + utf8_field(will["topic"]) + utf8_field(will["payload"])
    else:
        body += bytes([flags]) + struct.pack("!H", keep_alive) + utf8_field(client_id)
    send_packet(sock, 0x10, body, timeout)
    header, ack = read_packet(sock, timeout)
    if header != 0x20 or len(ack) != 2:
        raise MQTTError(f"Expected CONNACK, received header 0x{header:02x}, body {ack!r}")
    if ack[1]:
        raise MQTTError(f"CONNECT rejected by broker (code {ack[1]})")
    return sock


def subscribe_topic(sock, topic, timeout):
    packet_id = 1
    body = struct.pack("!H", packet_id) + utf8_field(topic) + b"\x00"
    send_packet(sock, 0x82, body, timeout)
    header, ack = read_packet(sock, timeout)
    expected = struct.pack("!H", packet_id) + b"\x00"
    if header != 0x90 or ack != expected:
        raise MQTTError(f"Expected SUBACK for {topic!r}; got 0x{header:02x}, {ack!r}")


def publish(sock, topic, payload, retain, timeout):
    header = 0x30 | (0x01 if retain else 0x00)
    send_packet(sock, header, utf8_field(topic) + payload, timeout)


def parse_publish(header, body):
    """Return (topic, payload, retain) for a QoS 0 PUBLISH, else None."""
    if (header & 0xF0) != 0x30:
        return None
    topic_length = struct.unpack("!H", body[:2])[0]
    topic = body[2:2 + topic_length].decode("utf-8", "replace")
    return topic, body[2 + topic_length:], bool(header & 0x01)


def send_ping(sock, timeout):
    send_packet(sock, 0xC0, b"", timeout)
    header, _ = read_packet(sock, timeout)
    if header != 0xD0:
        raise MQTTError(f"Expected PINGRESP, received header 0x{header:02x}")


def state_payload_for(entry, payload):
    if payload in entry["state_payloads"]:
        return payload
    return PAYLOAD_ALIASES.get(payload.decode("utf-8"), "").encode("utf-8")


def run_device(args, contract, stack):
    mapping = build_command_map(contract)
    will = contract["last_will"]
    online_topic = will["topic"]
    keep_alive = contract.get("keep_alive_seconds", 30)
    sock = connect_broker(stack, args.host, args.port, args.client_id, args.timeout,
                          will=will, keep_alive=keep_alive)
    publish(sock, online_topic, b"ONLINE", True, args.timeout)
    subscribe_topic(sock, "smarthome/cmd/+", args.timeout)
    log(f"online as {args.client_id!r}; subscribed smarthome/cmd/+; LWT OFFLINE registered")

    last_seen = time.monotonic()
    try:
        while True:
            try:
                header, body = read_packet(sock, 1.0)
            except TimeoutError:
                if time.monotonic() - last_seen >= keep_alive / 2:
                    send_ping(sock, args.timeout)
                    last_seen = time.monotonic()
                continue
            last_seen = time.monotonic()

            if (header & 0xF0) != 0x30:
                continue
            topic, payload, retained = parse_publish(header, body)
            entry = mapping.get(topic)
            printable = payload.decode("utf-8", "replace")
            if entry is None:
                log(f"IGNORE unknown command topic {topic!r} ({printable!r})")
                continue
            if payload not in entry["payloads"]:
                log(f"REJECTED {topic} {printable!r} not in contract — ignored, state unchanged")
                continue
            state_topic = entry["state_topic"]
            state_payload = state_payload_for(entry, payload)
            publish(sock, state_topic, state_payload, entry["state_retain"], args.timeout)
            log(f"CMD {topic} {printable!r}{' (retained)' if retained else ''}"
                f" -> {state_topic}={state_payload.decode('ascii')} (retain={entry['state_retain']})")
    except KeyboardInterrupt:
        log("Ctrl+C — publishing OFFLINE before DISCONNECT (contract §4.7)")
        publish(sock, online_topic, b"OFFLINE", True, args.timeout)
        with suppress(OSError):
            send_packet(sock, 0xE0, b"", args.timeout)  # DISCONNECT


def run_replay(args, contract, stack):
    entries = json.loads(Path(args.replay).read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("Replay file must be a JSON list of {topic, payload} entries")
    client_id = f"fakereplay{uuid.uuid4().hex[:8]}"
    sock = connect_broker(stack, args.host, args.port, client_id, args.timeout)
    log(f"replaying {len(entries)} messages as {client_id!r}")
    for index, item in enumerate(entries, 1):
        topic = item["topic"]
        payload = str(item["payload"]).encode("utf-8")
        retain = bool(item.get("retain", False))
        delay = item.get("delay_ms", args.delay_ms) / 1000.0
        if delay:
            time.sleep(delay)
        publish(sock, topic, payload, retain, args.timeout)
        log(f"{index}/{len(entries)} {topic} {payload.decode('utf-8', 'replace')!r}"
            f" (retain={retain})")
    with suppress(OSError):
        send_packet(sock, 0xE0, b"", args.timeout)  # DISCONNECT
    log("replay finished")


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
    parser.add_argument("--client-id", default="FakeESP32_Test",
                        help="device client id (default: FakeESP32_Test, never ESP32_SmartHome_Core)")
    parser.add_argument("--timeout", type=timeout_seconds, default=5.0, help="seconds per packet (default: 5)")
    parser.add_argument("--replay", type=Path, help="JSON trace file to replay instead of running live")
    parser.add_argument("--delay-ms", type=int, default=250,
                        help="default pacing between replayed messages in ms (default: 250)")
    args = parser.parse_args()

    try:
        contract = load_contract()
        with ExitStack() as stack:
            if args.replay:
                run_replay(args, contract, stack)
            else:
                run_device(args, contract, stack)
    except KeyboardInterrupt:
        log("interrupted")
        return 0
    except (OSError, MQTTError, ValueError, KeyError, TypeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        if isinstance(exc, ConnectionRefusedError):
            print("Check that EMQX is running and MQTT TCP port 1883 is published.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
