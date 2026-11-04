#!/usr/bin/env python3
"""
Local Network Device & MQTT Port 1883 Discovery Tool

Discovers active devices on the current local network subnet using ARP and ICMP ping,
identifies device roles (Gateway, This Machine, Peer), and tests TCP port 1883 (MQTT).

Uses only Python standard library modules.
"""

import ipaddress
import re
import socket
import subprocess
import sys
import threading
from concurrent.futures import ThreadPoolExecutor


def get_default_interface_and_ip():
    """Detect default route interface, local IP, and subnet."""
    try:
        # Route to a public IP to find the default outgoing interface and local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    # Query 'ip route' or 'ip addr' to find interface and netmask/prefix
    interface = None
    network = None
    gateway = None

    try:
        route_output = subprocess.check_output(["ip", "route", "show"], text=True)
        for line in route_output.splitlines():
            if line.startswith("default"):
                parts = line.split()
                if "dev" in parts:
                    interface = parts[parts.index("dev") + 1]
                if "via" in parts:
                    gateway = parts[parts.index("via") + 1]

        if interface:
            addr_output = subprocess.check_output(
                ["ip", "-o", "-f", "inet", "addr", "show", interface], text=True
            )
            match = re.search(r"inet\s+(\d+\.\d+\.\d+\.\d+/\d+)", addr_output)
            if match:
                network = ipaddress.ip_network(match.group(1), strict=False)
    except Exception as e:
        print(f"[!] Warning: Could not detect network via 'ip' command: {e}", file=sys.stderr)

    return interface, local_ip, gateway, network


def ping_host(ip_str):
    """Send a single fast ping to populate ARP cache."""
    try:
        subprocess.run(
            ["ping", "-c", "1", "-W", "1", ip_str],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=1.5,
        )
    except Exception:
        pass


def check_port_1883(ip_str, timeout=1.0):
    """Check if TCP port 1883 is open, and if it responds like an MQTT broker."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((ip_str, 1883))
        # Port is open. Try sending a basic MQTT 3.1.1 CONNECT packet
        # Header: 0x10, len: 12, protocol: 'MQTT', level 4, flags 2, keepalive 0, client_id 'pydisc'
        connect_packet = (
            b"\x10\x12\x00\x04MQTT\x04\x02\x00\x00\x00\x06pydisc"
        )
        s.sendall(connect_packet)
        try:
            resp = s.recv(4)
            s.close()
            if resp and resp[0] == 0x20:  # CONNACK
                return "OPEN (MQTT Broker Active)"
        except Exception:
            pass
        s.close()
        return "OPEN (TCP 1883 Listening)"
    except ConnectionRefusedError:
        return "CLOSED (Connection refused)"
    except socket.timeout:
        return "FILTERED (Timeout / Firewalled)"
    except Exception as e:
        return f"ERROR ({e})"


def get_arp_table(interface=None):
    """Retrieve ARP table mapping IPv4 -> (MAC, State)."""
    arp_entries = {}
    try:
        cmd = ["ip", "-4", "neigh", "show"]
        if interface:
            cmd.extend(["dev", interface])
        output = subprocess.check_output(cmd, text=True)
        for line in output.splitlines():
            parts = line.split()
            if len(parts) >= 4 and "lladdr" in parts:
                ip = parts[0]
                try:
                    ipaddress.IPv4Address(ip)
                except ValueError:
                    continue
                mac = parts[parts.index("lladdr") + 1]
                state = parts[-1]
                arp_entries[ip] = (mac, state)
    except Exception:
        pass
    return arp_entries


def scan_network():
    interface, local_ip, gateway, network = get_default_interface_and_ip()

    if not network:
        print("[-] Could not determine local subnet automatically.")
        return

    print("=" * 90)
    print(f"[*] Scanning Interface: {interface} | Subnet: {network} | Local IP: {local_ip}")
    print("=" * 90)

    # 1. Ping sweep in parallel to populate the kernel's ARP cache
    hosts = [str(ip) for ip in network.hosts()]
    with ThreadPoolExecutor(max_workers=50) as executor:
        executor.map(ping_host, hosts)

    # 2. Read ARP table
    arp_table = get_arp_table(interface)

    # Compile list of active devices:
    # - Local machine
    # - Gateway
    # - Any host present with valid MAC in ARP table
    discovered_ips = set()
    for ip, (mac, state) in arp_table.items():
        if state not in ("FAILED", "INCOMPLETE") and mac != "00:00:00:00:00:00":
            discovered_ips.add(ip)

    discovered_ips.add(local_ip)
    if gateway:
        discovered_ips.add(gateway)

    # Sort IP addresses numerically
    def ip_sort_key(ip):
        try:
            return int(ipaddress.IPv4Address(ip))
        except ValueError:
            return 0

    sorted_ips = sorted(discovered_ips, key=ip_sort_key)

    # 3. Check Port 1883 on each device
    results = []
    for ip in sorted_ips:
        mac = "-"
        if ip == local_ip:
            role = "Your Machine (Local Host)"
            mac = "Self"
        elif ip == gateway:
            role = "Gateway (Router / Hotspot)"
            if ip in arp_table:
                mac = arp_table[ip][0]
        else:
            role = "Peer Device / ESP32 / Client"
            if ip in arp_table:
                mac = arp_table[ip][0]

        port_status = check_port_1883(ip)
        results.append({
            "ip": ip,
            "mac": mac,
            "role": role,
            "port_1883": port_status
        })

    # 4. Print Table
    col_ip = 16
    col_mac = 19
    col_role = 30
    col_port = 30

    header = (
        f"| {'IP Address':<{col_ip}} | {'MAC Address':<{col_mac}} | {'Role / Identity':<{col_role}} | {'Port 1883 Status':<{col_port}} |"
    )
    separator = (
        f"|{'-' * (col_ip + 2)}|{'-' * (col_mac + 2)}|{'-' * (col_role + 2)}|{'-' * (col_port + 2)}|"
    )

    print("\n" + separator)
    print(header)
    print(separator)
    for r in results:
        row = (
            f"| {r['ip']:<{col_ip}} | {r['mac']:<{col_mac}} | {r['role']:<{col_role}} | {r['port_1883']:<{col_port}} |"
        )
        print(row)
    print(separator + "\n")


if __name__ == "__main__":
    scan_network()
