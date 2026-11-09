import json
import queue
import threading
from typing import List, Dict, Optional, Callable

class LogStore:
    """Thread-safe in-memory store for MQTT telemetry and SSE subscriber manager."""

    def __init__(self, max_history: int = 300):
        self.max_history = max_history
        self._history: List[Dict] = []
        self._lock = threading.Lock()
        self._subscribers: List[queue.Queue] = []
        self._subs_lock = threading.Lock()
        self._listeners: List[Callable[[Dict], None]] = []
        self._listeners_lock = threading.Lock()

    def add_log(self, entry: Dict) -> None:
        """Adds a log entry, notifies all SSE subscribers and internal listeners."""
        with self._lock:
            self._history.append(entry)
            if len(self._history) > self.max_history:
                self._history.pop(0)

        # Notify active SSE subscribers
        with self._subs_lock:
            stale = []
            for q in self._subscribers:
                try:
                    q.put_nowait(entry)
                except queue.Full:
                    stale.append(q)
            for s in stale:
                if s in self._subscribers:
                    self._subscribers.remove(s)

        # Notify internal listeners (e.g. RuleEngine)
        with self._listeners_lock:
            listeners = list(self._listeners)
        for listener in listeners:
            try:
                listener(entry)
            except Exception as e:
                print(f"Log listener error: {e}")

    def add_listener(self, callback: Callable[[Dict], None]) -> None:
        """Registers a callback invoked for every new log entry."""
        with self._listeners_lock:
            self._listeners.append(callback)

    def remove_listener(self, callback: Callable[[Dict], None]) -> None:
        """Unregisters a previously added callback."""
        with self._listeners_lock:
            if callback in self._listeners:
                self._listeners.remove(callback)

    def get_logs(self, device: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """Returns recent logs in reverse chronological order (newest first)."""
        with self._lock:
            logs = list(self._history)

        if device and device != "ALL":
            logs = [entry for entry in logs if entry.get("device") == device]

        logs.reverse()
        if limit:
            logs = logs[:limit]
        return logs

    def clear(self) -> None:
        """Clears all stored history."""
        with self._lock:
            self._history.clear()

    def subscribe(self) -> queue.Queue:
        """Registers a new SSE client queue."""
        q = queue.Queue(maxsize=100)
        with self._subs_lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        """Unregisters an SSE client queue."""
        with self._subs_lock:
            if q in self._subscribers:
                self._subscribers.remove(q)
