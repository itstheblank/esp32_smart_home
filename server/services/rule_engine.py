import json
import os
import threading
import time
import urllib.request
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from rich.console import Console
    console = Console()
    HAS_RICH = True
except ImportError:
    console = None
    HAS_RICH = False

from config import Config

OPERATORS = [
    "eq", "neq", "gt", "gte", "lt", "lte",
    "contains", "not_contains", "exists", "not_exists"
]
ACTION_TYPES = ["command", "notify", "webhook"]
LOGIC_MODES = ["AND", "OR"]
ENTRY_FIELDS = ["device", "id", "action", "topic", "time", "success", "data", "raw"]


class RuleEngine:
    """Evaluates incoming log entries against user-defined rules and executes actions.

    A rule consists of:
      - match:       coarse pre-filter (device, id) - empty values mean "any"
      - conditions:  list of {field, operator, value} combined via AND/OR logic
      - actions:     list of actions executed when the rule fires:
                       * command -> publish MQTT command via MqttService
                       * notify  -> inject a SYSTEM event into the log stream
                       * webhook -> async HTTP POST with rule context
      - cooldownSec: minimum seconds between two triggers of the same rule

    Rules are persisted as JSON in `rules_file` and survive restarts.
    """

    def __init__(self, mqtt_service, log_store, rules_file: str, max_events: int = 100):
        self.mqtt_service = mqtt_service
        self.log_store = log_store
        self.rules_file = rules_file
        self.max_events = max_events

        self._rules: List[Dict] = []
        self._events: List[Dict] = []
        self._lock = threading.RLock()

        self._load_rules()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def _load_rules(self) -> None:
        if not os.path.exists(self.rules_file):
            return
        try:
            with open(self.rules_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                with self._lock:
                    self._rules = data
                self._print(f"Loaded {len(data)} rule(s) from {os.path.basename(self.rules_file)}")
        except Exception as e:
            self._print(f"WARNING: Could not load rules file ({e}). Starting with empty rule set.")

    def _save_rules(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.rules_file), exist_ok=True)
            with self._lock:
                snapshot = json.dumps(self._rules, indent=2)
            with open(self.rules_file, "w", encoding="utf-8") as f:
                f.write(snapshot)
        except Exception as e:
            self._print(f"WARNING: Could not save rules file ({e})")

    # ------------------------------------------------------------------
    # CRUD API
    # ------------------------------------------------------------------
    def list_rules(self) -> List[Dict]:
        with self._lock:
            return [dict(r) for r in self._rules]

    def create_rule(self, spec: Dict) -> Dict:
        rule = self._validate(spec)
        rule["id"] = uuid.uuid4().hex[:8]
        rule["createdAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        rule["lastTriggered"] = None
        rule["triggerCount"] = 0
        with self._lock:
            self._rules.append(rule)
        self._save_rules()
        self._print(f"Rule created: '{rule['name']}' ({rule['id']})")
        return dict(rule)

    def update_rule(self, rule_id: str, spec: Dict) -> Optional[Dict]:
        updates = self._validate(spec)
        with self._lock:
            for i, existing in enumerate(self._rules):
                if existing.get("id") == rule_id:
                    merged = {**existing, **updates, "id": rule_id}
                    self._rules[i] = merged
                    self._save_rules()
                    self._print(f"Rule updated: '{merged['name']}' ({rule_id})")
                    return dict(merged)
        return None

    def delete_rule(self, rule_id: str) -> bool:
        with self._lock:
            before = len(self._rules)
            self._rules = [r for r in self._rules if r.get("id") != rule_id]
            removed = len(self._rules) < before
        if removed:
            self._save_rules()
            self._print(f"Rule deleted: {rule_id}")
        return removed

    def set_enabled(self, rule_id: str, enabled: bool) -> Optional[Dict]:
        with self._lock:
            for r in self._rules:
                if r.get("id") == rule_id:
                    r["enabled"] = bool(enabled)
                    self._save_rules()
                    return dict(r)
        return None

    def list_events(self) -> List[Dict]:
        """Returns recent trigger events, newest first."""
        with self._lock:
            events = list(self._events)
        events.reverse()
        return events

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------
    def _validate(self, spec: Dict) -> Dict:
        if not isinstance(spec, dict):
            raise ValueError("Rule payload must be a JSON object")

        clean: Dict[str, Any] = {}

        name = str(spec.get("name") or "").strip()
        if not name:
            raise ValueError("Rule name is required")
        clean["name"] = name[:100]
        clean["enabled"] = bool(spec.get("enabled", True))

        match = spec.get("match") or {}
        if not isinstance(match, dict):
            raise ValueError("'match' must be an object")
        device = str(match.get("device") or "").strip().upper()
        rule_id_val = match.get("id")
        parsed_id = None
        if rule_id_val not in (None, ""):
            try:
                parsed_id = int(rule_id_val)
            except (TypeError, ValueError):
                raise ValueError("Match 'id' must be an integer")
        clean["match"] = {"device": device, "id": parsed_id}

        logic = str(spec.get("logic") or "AND").strip().upper()
        if logic not in LOGIC_MODES:
            raise ValueError(f"'logic' must be one of {LOGIC_MODES}")
        clean["logic"] = logic

        conditions = spec.get("conditions") or []
        if not isinstance(conditions, list):
            raise ValueError("'conditions' must be a list")
        clean_conditions = []
        for cond in conditions:
            if not isinstance(cond, dict):
                raise ValueError("Each condition must be an object")
            field = str(cond.get("field") or "").strip()
            operator = str(cond.get("operator") or "").strip()
            if not field:
                raise ValueError("Condition 'field' is required")
            if operator not in OPERATORS:
                raise ValueError(f"Unknown operator '{operator}'. Allowed: {', '.join(OPERATORS)}")
            clean_conditions.append({
                "field": field,
                "operator": operator,
                "value": cond.get("value"),
            })
        clean["conditions"] = clean_conditions

        actions = spec.get("actions") or []
        if not isinstance(actions, list) or len(actions) == 0:
            raise ValueError("At least one action is required")
        clean_actions = []
        for action in actions:
            if not isinstance(action, dict):
                raise ValueError("Each action must be an object")
            a_type = str(action.get("type") or "").strip()
            if a_type not in ACTION_TYPES:
                raise ValueError(f"Unknown action type '{a_type}'. Allowed: {', '.join(ACTION_TYPES)}")
            if a_type == "command":
                device = str(action.get("device") or "").strip().upper()
                cmd_action = str(action.get("action") or "").strip()
                if not device or not cmd_action:
                    raise ValueError("Command action requires 'device' and 'action'")
                try:
                    dev_id = int(action.get("id", 1))
                except (TypeError, ValueError):
                    raise ValueError("Command action 'id' must be an integer")
                data = action.get("data") or {}
                if not isinstance(data, dict):
                    raise ValueError("Command action 'data' must be an object")
                try:
                    duration = float(action.get("durationSec") or 0)
                except (TypeError, ValueError):
                    raise ValueError("Command action 'durationSec' must be a number")
                if duration < 0:
                    raise ValueError("Command action 'durationSec' must be >= 0")
                off_action = str(action.get("offAction") or "").strip()
                if duration > 0 and not off_action:
                    raise ValueError("Timed command (durationSec > 0) requires 'offAction' (e.g. OFF / CLOSE)")
                clean_actions.append({
                    "type": "command", "device": device, "id": dev_id,
                    "action": cmd_action, "data": data,
                    "durationSec": duration, "offAction": off_action,
                })
            elif a_type == "notify":
                clean_actions.append({
                    "type": "notify",
                    "message": str(action.get("message") or "")[:300],
                })
            elif a_type == "webhook":
                url = str(action.get("url") or "").strip()
                if not url.startswith(("http://", "https://")):
                    raise ValueError("Webhook action requires a valid 'url' (http/https)")
                payload = action.get("payload") or {}
                if not isinstance(payload, dict):
                    raise ValueError("Webhook action 'payload' must be an object")
                clean_actions.append({"type": "webhook", "url": url, "payload": payload})
        clean["actions"] = clean_actions

        try:
            cooldown = float(spec.get("cooldownSec", 0) or 0)
        except (TypeError, ValueError):
            raise ValueError("'cooldownSec' must be a number")
        if cooldown < 0:
            raise ValueError("'cooldownSec' must be >= 0")
        clean["cooldownSec"] = cooldown

        return clean

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------
    def handle_log(self, entry: Dict) -> None:
        """Listener callback: evaluates every incoming log entry against all rules."""
        try:
            # Never evaluate rule-generated notifications (prevents feedback loops)
            if entry.get("topic") == Config.TOPIC_RULES:
                return

            for rule in self.list_rules():
                if not rule.get("enabled", False):
                    continue
                if not self._matches(rule, entry):
                    continue

                now = time.time()
                with self._lock:
                    stored = self._find(rule["id"])
                    if not stored:
                        continue
                    last = stored.get("lastTriggeredTs") or 0
                    if now - last < float(stored.get("cooldownSec", 0)):
                        continue
                    stored["lastTriggeredTs"] = now
                    stored["lastTriggered"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    stored["triggerCount"] = int(stored.get("triggerCount", 0)) + 1

                results = self._execute_actions(stored, entry)
                self._record_event(stored, entry, results)
                self._save_rules()
        except Exception as e:
            self._print(f"Rule evaluation error: {e}")

    def test_rule(self, spec: Dict, sample: Dict) -> Dict:
        """Dry-runs a rule (not necessarily persisted) against a sample log entry."""
        rule = self._validate(spec)
        detail = []
        matched_all = True
        for cond in rule["conditions"]:
            actual = self._resolve(sample, cond["field"])
            passed = self._compare(actual, cond["operator"], cond["value"])
            detail.append({
                "field": cond["field"],
                "operator": cond["operator"],
                "expected": cond["value"],
                "actual": actual,
                "passed": passed,
            })
            if not passed:
                matched_all = False

        match_ok = self._match_block_ok(rule, sample)
        conditions_ok = self._combine(rule, [d["passed"] for d in detail])
        return {
            "matched": match_ok and conditions_ok,
            "matchBlockOk": match_ok,
            "conditionResults": detail,
        }

    def _find(self, rule_id: str) -> Optional[Dict]:
        for r in self._rules:
            if r.get("id") == rule_id:
                return r
        return None

    def _match_block_ok(self, rule: Dict, entry: Dict) -> bool:
        match = rule.get("match", {})
        if match.get("device") and str(entry.get("device", "")).upper() != match["device"]:
            return False
        if match.get("id") is not None:
            try:
                if int(entry.get("id", -1)) != int(match["id"]):
                    return False
            except (TypeError, ValueError):
                return False
        return True

    def _combine(self, rule: Dict, results: List[bool]) -> bool:
        if not results:
            return True
        return all(results) if rule.get("logic", "AND") == "AND" else any(results)

    def _matches(self, rule: Dict, entry: Dict) -> bool:
        if not self._match_block_ok(rule, entry):
            return False
        conditions = rule.get("conditions", [])
        if not conditions:
            return True
        results = []
        for cond in conditions:
            actual = self._resolve(entry, cond["field"])
            results.append(self._compare(actual, cond["operator"], cond["value"]))
        return self._combine(rule, results)

    def _resolve(self, entry: Dict, path: str):
        """Resolves a dotted field path against a log entry (e.g. 'data.temperature')."""
        if path in ("device", "id", "action", "topic", "time", "success", "raw"):
            return entry.get(path)
        if path == "data":
            return entry.get("data")
        if path.startswith("data."):
            current = entry.get("data")
            for part in path.split(".")[1:]:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
            return current
        return entry.get(path)

    def _compare(self, actual: Any, operator: str, expected: Any) -> bool:
        if operator == "exists":
            return actual is not None
        if operator == "not_exists":
            return actual is None
        if actual is None:
            return False

        if operator == "eq":
            return self._loose_eq(actual, expected)
        if operator == "neq":
            return not self._loose_eq(actual, expected)

        if operator in ("gt", "gte", "lt", "lte"):
            try:
                a = float(actual)
                b = float(expected)
            except (TypeError, ValueError):
                return False
            if operator == "gt":
                return a > b
            if operator == "gte":
                return a >= b
            if operator == "lt":
                return a < b
            return a <= b

        if operator == "contains":
            if isinstance(actual, (list, tuple, set)):
                return expected in actual or str(expected) in [str(x) for x in actual]
            return str(expected) in str(actual)
        if operator == "not_contains":
            if isinstance(actual, (list, tuple, set)):
                return not (expected in actual or str(expected) in [str(x) for x in actual])
            return str(expected) not in str(actual)

        return False

    @staticmethod
    def _loose_eq(actual: Any, expected: Any) -> bool:
        if isinstance(actual, bool):
            if isinstance(expected, bool):
                return actual == expected
            return str(expected).strip().lower() in ("true", "1", "yes") if actual else \
                str(expected).strip().lower() in ("false", "0", "no")
        if actual == expected:
            return True
        try:
            return float(actual) == float(expected)
        except (TypeError, ValueError):
            return str(actual) == str(expected)

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------
    def _execute_actions(self, rule: Dict, entry: Dict) -> List[Dict]:
        results = []
        for action in rule.get("actions", []):
            a_type = action.get("type")
            try:
                if a_type == "command":
                    ok = self.mqtt_service.send_command(
                        action["device"], action["id"], action["action"], action.get("data") or {}
                    )
                    detail = f"{action['device']} {action['id']} -> {action['action']}"
                    if not ok:
                        detail += " (MQTT not connected)"
                    results.append({
                        "type": "command",
                        "status": "ok" if ok else "failed",
                        "detail": detail,
                    })
                    duration = float(action.get("durationSec") or 0)
                    if ok and duration > 0:
                        timer = threading.Timer(
                            duration, self._send_revert_command, args=(rule, action)
                        )
                        timer.daemon = True
                        timer.start()
                elif a_type == "notify":
                    self._add_notify_log(rule, action)
                    results.append({"type": "notify", "status": "ok"})
                elif a_type == "webhook":
                    threading.Thread(
                        target=self._send_webhook, args=(rule, action, entry), daemon=True
                    ).start()
                    results.append({"type": "webhook", "status": "sent", "detail": action["url"]})
            except Exception as e:
                results.append({"type": a_type, "status": "error", "detail": str(e)})
        return results

    def _send_revert_command(self, rule: Dict, action: Dict) -> None:
        """Fires after durationSec: sends the follow-up command (e.g. OFF / CLOSE)."""
        ok = self.mqtt_service.send_command(
            action["device"], action["id"], action["offAction"], action.get("data") or {}
        )
        state = "sent" if ok else "FAILED (MQTT not connected)"
        self._print(
            f"Timed revert for rule '{rule['name']}': "
            f"{action['device']} {action['id']} -> {action['offAction']} {state}"
        )

    def _add_notify_log(self, rule: Dict, action: Dict) -> None:
        message = action.get("message", "")
        entry = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "topic": Config.TOPIC_RULES,
            "device": "SYSTEM",
            "id": "",
            "action": "RULE_FIRED",
            "success": True,
            "data": {"rule": rule["name"], "message": message},
            "raw": f"[RULE] {rule['name']}: {message}",
        }
        self.log_store.add_log(entry)

    def _send_webhook(self, rule: Dict, action: Dict, entry: Dict) -> None:
        payload = {
            "rule": rule["name"],
            "trigger": {
                "time": entry.get("time"),
                "topic": entry.get("topic"),
                "device": entry.get("device"),
                "id": entry.get("id"),
                "action": entry.get("action"),
                "data": entry.get("data"),
            },
            "payload": action.get("payload") or {},
        }
        req = urllib.request.Request(
            action["url"],
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                self._print(f"Webhook for rule '{rule['name']}' responded {resp.status}")
        except Exception as e:
            self._print(f"Webhook for rule '{rule['name']}' failed: {e}")

    def _record_event(self, rule: Dict, entry: Dict, results: List[Dict]) -> None:
        event = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "ruleId": rule.get("id"),
            "ruleName": rule.get("name"),
            "trigger": {
                "device": entry.get("device"),
                "id": entry.get("id"),
                "action": entry.get("action"),
                "data": entry.get("data"),
            },
            "actions": results,
        }
        with self._lock:
            self._events.append(event)
            if len(self._events) > self.max_events:
                self._events.pop(0)

        failed = [r for r in results if r.get("status") not in ("ok", "sent")]
        status = "OK" if not failed else f"{len(failed)} action(s) failed"
        self._print(f"Rule '{rule.get('name')}' triggered [{status}]")

    @staticmethod
    def _print(message: str) -> None:
        ts = datetime.now().strftime("%H:%M:%S")
        if HAS_RICH and console:
            console.print(f"[dim]{ts}[/dim] [bold magenta][RULES][/bold magenta] {message}")
        else:
            print(f"[{ts}] [RULES] {message}")
