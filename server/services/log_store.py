import json
import queue
import threading
from typing import List, Dict, Optional

class LogStore:
    """Thread-safe in-memory store for MQTT telemetry and SSE subscriber manager."""

    def __init__(self, max_history: int = 300):
        self.max_history = max_history
        self._history: List[Dict] = []
        self._lock = threading.Lock()
        self._subscribers: List[queue.Queue] = []
        self._subs_lock = threading.Lock()

    def add_log(self, entry: Dict) -> None:
        """Adds a log entry and notifies all SSE subscribers."""
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
