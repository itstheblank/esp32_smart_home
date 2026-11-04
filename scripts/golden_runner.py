#!/usr/bin/env python3
"""Golden-trace runner: one command, pass/fail battery for the MQTT smart-home pipeline.

Sim mode (default): starts scripts/fake_esp32.py as a subprocess and runs the
full battery - ONLINE announcement, every contract command, the CLOSE -> CLOSED
alias, invalid-command rejection, retained-state readback, --replay support,
clean Ctrl+C shutdown (OFFLINE before DISCONNECT) and the broker LWT on kill.

Board mode (--board): runs the core battery against an already-connected
device (the real ESP32 or a manually started fake_esp32.py). Hardware-only
steps are printed as a manual checklist instead of being executed.

--trace FILE: run exactly the golden steps from FILE instead of the built-in
battery. --record FILE: write the command -> state conversation of a run as
such a golden trace, so later runs pin the known-good behaviour with --trace.

Exit codes: 0 all checks passed, 1 at least one check failed, 2 environment
error (broker unreachable, device never came online).

Uses only Python's standard library; reuses the wire helpers of fake_esp32.py.
"""

import argparse
import json
from contextlib import ExitStack, suppress
from datetime import datetime
from pathlib import Path
import signal
import socket
import struct
import subprocess
import sys
import tempfile
import time
import uuid

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from fake_esp32 import (  # noqa: E402
    MQTTError,
    connect_broker,
    parse_publish,
    port_number,
    publish,
    read_packet,
    send_packet,
    timeout_seconds,
    utf8_field,
)

FAKE_DEVICE = SCRIPTS_DIR / "fake_esp32.py"
CMD_TOPICS = {"light": "smarthome/cmd/light", "door": "smarthome/cmd/door"}
STATE_TOPICS = {
    "light": "smarthome/state/light",
    "door": "smarthome/state/door",
    "motion": "smarthome/state/motion",
    "online": "smarthome/state/online",
}
ONLINE_TOPIC = STATE_TOPICS["online"]


def say(message):
    stamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{stamp}] [runner] {message}", flush=True)


def subscribe_many(sock, topics, timeout):
    """Subscribe every filter in one SUBSCRIBE packet so the SUBACK cannot
    interleave with retained deliveries (which would desync the stream)."""
    packet_id = 1
    body = struct.pack("!H", packet_id)
    for topic in topics:
        body += utf8_field(topic) + b"\x00"
    send_packet(sock, 0x82, body, timeout)
    header, ack = read_packet(sock, timeout)
    expected = struct.pack("!H", packet_id) + b"\x00" * len(topics)
    if header != 0x90 or ack != expected:
        raise MQTTError(f"Expected SUBACK for {len(topics)} filters; got 0x{header:02x}, {ack!r}")


class CheckFailure(Exception):
    """One battery check did not observe what the contract promised."""


class Observer:
    """A subscriber socket that waits for a matching publish."""

    def __init__(self, stack, args, topics):
        client_id = f"goldenobs{uuid.uuid4().hex[:8]}"
        self.sock = connect_broker(stack, args.host, args.port, client_id, args.timeout)
        subscribe_many(self.sock, topics, args.timeout)

    def wait_for(self, predicate, window):
        """Return the first (topic, payload, retain) matching predicate, else None."""
        deadline = time.monotonic() + window
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return None
            try:
                header, body = read_packet(self.sock, remaining)
            except TimeoutError:
                return None
            parsed = parse_publish(header, body)
            if parsed and predicate(*parsed):
                return parsed

    def expect(self, name, topic, payload, window):
        """Wait for a live publish of topic=payload; retain flag not asserted."""
        found = self.wait_for(lambda t, p, r: t == topic and p == payload, window)
        if found is None:
            raise CheckFailure(f"no PUBLISH {topic}={payload.decode()} within {window:g}s")
        say(f"PASS {name}: observed {topic}={payload.decode()} (retain={found[2]})")

    def expect_silence(self, name, topic, window):
        found = self.wait_for(lambda t, p, r: t == topic, window)
        if found is not None:
            raise CheckFailure(
                f"unexpected PUBLISH {topic}={found[1].decode('utf-8', 'replace')!r}"
            )
        say(f"PASS {name}: {topic} stayed silent for {window:g}s")


class Checkbook:
    def __init__(self):
        self.results = []

    def run(self, name, check):
        try:
            check()
        except CheckFailure as exc:
            say(f"FAIL {name}: {exc}")
            self.results.append((name, False, str(exc)))
        except (OSError, MQTTError) as exc:
            say(f"FAIL {name}: transport error {exc}")
            self.results.append((name, False, f"transport error {exc}"))
        else:
            self.results.append((name, True, ""))

    def summary(self):
        total = len(self.results)
        passed = total - sum(1 for _, ok, _ in self.results if not ok)
        say(f"=== {passed}/{total} checks passed ===")
        for name, ok, detail in self.results:
            if not ok:
                print(f"  FAILED: {name}: {detail}")
        return 0 if passed == total and total else 1


def connect_as(stack, args, prefix, topics=()):
    sock = connect_broker(
        stack, args.host, args.port, f"{prefix}{uuid.uuid4().hex[:8]}", args.timeout
    )
    for topic in topics:
        subscribe_topic(sock, topic, args.timeout)
    return sock


def clear_retained(stack, args):
    janitor = connect_as(stack, args, "goldenjan")
    for topic in STATE_TOPICS.values():
        publish(janitor, topic, b"", True, args.timeout)
    with suppress(OSError):
        send_packet(janitor, 0xE0, b"", args.timeout)


def send_command(sock, topic, payload, timeout):
    publish(sock, topic, payload.encode("utf-8"), False, timeout)


def spawn_device(args):
    return subprocess.Popen(
        [
            sys.executable,
            str(FAKE_DEVICE),
            "--host",
            args.host,
            "--port",
            str(args.port),
            "--client-id",
            args.client_id,
        ]
    )


def stop_device(device, graceful):
    if device.poll() is None:
        device.send_signal(signal.SIGINT if graceful else signal.SIGKILL)
        with suppress(subprocess.TimeoutExpired):
            device.wait(timeout=5)
    if device.poll() is None:
        with suppress(Exception):
            device.kill()


def command_expect(ctl, obs, args, cmd_topic, cmd_payload, state_topic, state_payload):
    """Send a command and wait for its state publish, retrying once.

    QoS 0 has no delivery guarantee: if the command outruns the device's
    SUBSCRIBE (fresh device, startup race) the broker drops it silently.
    One resend keeps the check about mapping, not about timing."""
    for attempt in (1, 2):
        send_command(ctl, cmd_topic, cmd_payload, args.timeout)
        try:
            obs.expect(
                f"{cmd_topic} {cmd_payload} -> {state_topic} {state_payload}",
                state_topic,
                state_payload.encode("utf-8"),
                args.window,
            )
            return
        except CheckFailure:
            if attempt == 2:
                raise
            say(f"retrying {cmd_topic} {cmd_payload} (QoS 0 delivery race)")


def trace_matches(found, expect):
    topic, payload, retain = found
    if topic != expect["topic"] or payload != expect["payload"].encode("utf-8"):
        return False
    return not expect.get("retain_strict") or retain == bool(expect.get("retain"))


def run_trace_steps(stack, args, steps):
    book = Checkbook()
    with ExitStack() as stack2:
        ctl = connect_as(stack2, args, "goldenctl")
        obs = Observer(stack2, args, sorted({s["expect"]["topic"] for s in steps}))
        for index, step in enumerate(steps, 1):
            send = step["send"]
            expect = step["expect"]

            def check(step=step, index=index):
                for attempt in (1, 2):
                    send_command(ctl, send["topic"], send["payload"], args.timeout)
                    found = obs.wait_for(
                        lambda t, p, r, e=expect: trace_matches((t, p, r), e), args.window
                    )
                    if found is not None:
                        say(f"PASS trace[{index}]: observed {found[0]}="
                            f"{found[1].decode('utf-8', 'replace')} (retain={found[2]})")
                        return
                    if attempt == 1:
                        say(f"retrying trace[{index}] (QoS 0 delivery race)")
                raise CheckFailure(
                    f"no PUBLISH {expect['topic']}={expect['payload']} within {args.window:g}s"
                )

            book.run(f"trace[{index}] {send['topic']}={send['payload']}", check)
    return book


def sim_battery(stack, args, record):
    book = Checkbook()
    device = spawn_device(args)
    replay_dir = None
    try:
        with ExitStack() as stack2:
            ctl = connect_as(stack2, args, "goldenctl")
            obs = Observer(stack2, args, list(STATE_TOPICS.values()))

            def online():
                found = obs.wait_for(
                    lambda t, p, r: t == ONLINE_TOPIC and p == b"ONLINE", 6.0
                )
                if found is None:
                    raise CheckFailure("device never announced ONLINE after connecting")
                say("PASS device announces ONLINE (retained flag on live delivery "
                    f"is {found[2]}; retention itself is verified by the readback check)")

            book.run("device announces ONLINE (retained)", online)

            command_specs = [
                ("light", "ON", "ON"),
                ("light", "OFF", "OFF"),
                ("door", "OPEN", "OPEN"),
                ("door", "CLOSE", "CLOSED"),
            ]
            for device_name, cmd_payload, state_payload in command_specs:
                cmd_topic = CMD_TOPICS[device_name]
                state_topic = STATE_TOPICS[device_name]

                def run_command(c=cmd_topic, p=cmd_payload, s=state_topic, sp=state_payload):
                    command_expect(ctl, obs, args, c, p, s, sp)

                book.run(
                    f"cmd/{device_name} {cmd_payload} -> state/{device_name} {state_payload}",
                    run_command,
                )
                if book.results[-1][1]:
                    record.append(
                        {
                            "send": {"topic": cmd_topic, "payload": cmd_payload},
                            "expect": {
                                "topic": state_topic,
                                "payload": state_payload,
                                "retain": True,
                            },
                        }
                    )

            def invalid():
                send_command(ctl, CMD_TOPICS["light"], "BOGUS", args.timeout)
                send_command(ctl, "smarthome/cmd/unknown", "ON", args.timeout)
                obs.expect_silence("invalid commands", STATE_TOPICS["light"], args.window)
            book.run("invalid command rejected, state unchanged", invalid)

            def readback():
                fresh = Observer(stack2, args, list(STATE_TOPICS.values()))
                expected = {
                    STATE_TOPICS["light"]: b"OFF",
                    STATE_TOPICS["door"]: b"CLOSED",
                    ONLINE_TOPIC: b"ONLINE",
                }
                deadline = time.monotonic() + args.window
                while expected and time.monotonic() < deadline:
                    header, body = read_packet(fresh.sock, max(0.1, deadline - time.monotonic()))
                    parsed = parse_publish(header, body)
                    if parsed and expected.get(parsed[0]) == parsed[1]:
                        del expected[parsed[0]]
                if expected:
                    raise CheckFailure(
                        "retained readback missing: "
                        + ", ".join(f"{t}={p.decode()}" for t, p in expected.items())
                    )
                say("PASS retained readback: light, door, online readable by a fresh subscriber")
            book.run("retained state readable by fresh subscriber", readback)

            def replay():
                nonlocal replay_dir
                replay_dir = tempfile.mkdtemp(prefix="golden-replay-")
                trace_file = Path(replay_dir) / "trace.json"
                trace_file.write_text(
                    json.dumps(
                        [{"topic": STATE_TOPICS["light"], "payload": "ON", "retain": True}]
                    ),
                    encoding="utf-8",
                )
                replay_proc = subprocess.Popen(
                    [
                        sys.executable,
                        str(FAKE_DEVICE),
                        "--host",
                        args.host,
                        "--port",
                        str(args.port),
                        "--replay",
                        str(trace_file),
                    ]
                )
                try:
                    found = obs.wait_for(
                        lambda t, p, r: t == STATE_TOPICS["light"] and p == b"ON", 6.0
                    )
                finally:
                    replay_proc.wait(timeout=10)
                if found is None:
                    raise CheckFailure("--replay did not publish the recorded message")
                say("PASS replay mode: recorded message re-published")
            book.run("replay mode re-publishes a recorded trace", replay)

            def clean_shutdown():
                device.send_signal(signal.SIGINT)
                obs.expect("Ctrl+C publishes OFFLINE", ONLINE_TOPIC, b"OFFLINE", 4.0)
                code = device.wait(timeout=5)
                if code != 0:
                    raise CheckFailure(f"fake_esp32 exited with code {code} after Ctrl+C")
            book.run("clean shutdown publishes OFFLINE before DISCONNECT", clean_shutdown)

        with ExitStack() as stack3:
            obs2 = Observer(stack3, args, [ONLINE_TOPIC])
            device2 = spawn_device(args)
            try:
                def lwt():
                    found = obs2.wait_for(
                        lambda t, p, r: t == ONLINE_TOPIC and p == b"ONLINE", 6.0
                    )
                    if found is None:
                        raise CheckFailure("second device never came online")
                    device2.send_signal(signal.SIGKILL)
                    obs2.expect("broker LWT after SIGKILL", ONLINE_TOPIC, b"OFFLINE", 4.0)
                    device2.wait(timeout=5)
                book.run("broker LWT fires OFFLINE when device dies", lwt)
            finally:
                stop_device(device2, graceful=False)
    finally:
        stop_device(device, graceful=True)
        if replay_dir:
            with suppress(OSError):
                Path(replay_dir).joinpath("trace.json").unlink(missing_ok=True)
                Path(replay_dir).rmdir()
    return book


def board_battery(stack, args):
    book = Checkbook()
    with ExitStack() as stack2:
        ctl = connect_as(stack2, args, "goldenctl")
        obs = Observer(stack2, args, list(STATE_TOPICS.values()))
        book.run(
            "device ONLINE retained on state/online",
            lambda: obs.expect("device ONLINE", ONLINE_TOPIC, b"ONLINE", args.window),
        )
        for cmd_topic, cmd_payload, state_topic, state_payload in (
            (CMD_TOPICS["light"], "ON", STATE_TOPICS["light"], "ON"),
            (CMD_TOPICS["light"], "OFF", STATE_TOPICS["light"], "OFF"),
            (CMD_TOPICS["door"], "OPEN", STATE_TOPICS["door"], "OPEN"),
            (CMD_TOPICS["door"], "CLOSE", STATE_TOPICS["door"], "CLOSED"),
        ):
            book.run(
                f"{cmd_topic} {cmd_payload} -> {state_topic} {state_payload}",
                lambda c=cmd_topic, p=cmd_payload, s=state_topic, sp=state_payload: (
                    command_expect(ctl, obs, args, c, p, s, sp)
                ),
            )
        book.run(
            "invalid command ignored",
            lambda: (
                send_command(ctl, CMD_TOPICS["light"], "BOGUS", args.timeout),
                obs.expect_silence("invalid command", STATE_TOPICS["light"], args.window),
            ),
        )
    print()
    say("manual board steps (not automated):")
    say("  1. cut board power or unplug Ethernet -> state/online shows retained OFFLINE (LWT)")
    say("  2. power the board again -> state/online returns ONLINE")
    say("  3. trigger the PIR -> state/motion DETECTED, then CLEAR")
    say("  4. tap a known card -> event/access JSON with uid and GRANTED/DENIED")
    return book


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="broker address (default: 127.0.0.1)")
    parser.add_argument("--port", type=port_number, default=1883)
    parser.add_argument("--board", action="store_true",
                        help="test an already-connected device instead of spawning fake_esp32.py")
    parser.add_argument("--client-id", default="FakeESP32_Runner",
                        help="device client id in sim mode (default: FakeESP32_Runner)")
    parser.add_argument("--trace", type=Path,
                        help="run exactly the golden steps from FILE instead of the battery")
    parser.add_argument("--record", type=Path,
                        help="write the command -> state conversation as a golden trace FILE")
    parser.add_argument("--keep-state", action="store_true",
                        help="do not clear retained state before/after a sim run")
    parser.add_argument("--timeout", type=timeout_seconds, default=5.0,
                        help="seconds per MQTT packet (default: 5)")
    parser.add_argument("--window", type=timeout_seconds, default=1.5,
                        help="seconds to wait for an expected message (default: 1.5)")
    args = parser.parse_args()

    try:
        with ExitStack() as stack:
            if args.trace:
                document = json.loads(args.trace.read_text(encoding="utf-8"))
                steps = document["steps"]
                say(f"golden trace {args.trace.name}: {len(steps)} steps - "
                    f"{document.get('description', '')}")
                device = None
                if not args.board:
                    if not args.keep_state:
                        clear_retained(stack, args)
                    device = spawn_device(args)
                book = run_trace_steps(stack, args, steps)
                if device is not None:
                    stop_device(device, graceful=True)
                return book.summary()

            record = []
            if not args.board:
                if not args.keep_state:
                    say("clearing stale retained state")
                    clear_retained(stack, args)
                book = sim_battery(stack, args, record)
                if not args.keep_state:
                    say("clearing retained state left by the run")
                    clear_retained(stack, args)
            else:
                book = board_battery(stack, args)
            if args.record and record:
                document = {
                    "description": (
                        f"golden trace recorded {datetime.now().isoformat(timespec='seconds')}"
                    ),
                    "steps": record,
                }
                args.record.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
                say(f"wrote {len(record)} steps to {args.record}")
            return book.summary()
    except (OSError, MQTTError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        if isinstance(exc, ConnectionRefusedError):
            print("Check that EMQX is running and MQTT TCP port 1883 is published.", file=sys.stderr)
        return 2
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL: bad golden trace file: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
