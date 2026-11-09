const OPERATORS = [
  { v: "eq", label: "== equals" },
  { v: "neq", label: "!= not equals" },
  { v: "gt", label: "> greater than" },
  { v: "gte", label: ">= greater or equal" },
  { v: "lt", label: "< less than" },
  { v: "lte", label: "<= less or equal" },
  { v: "contains", label: "contains" },
  { v: "not_contains", label: "does not contain" },
  { v: "exists", label: "exists" },
  { v: "not_exists", label: "does not exist" }
];

let rules = [];
let events = [];
let editingId = null;

function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function showToast(text) {
  const t = document.getElementById("toast");
  t.innerText = text;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 2600);
}

// ---------------------------------------------------------------------------
// Builder: conditions
// ---------------------------------------------------------------------------
function addConditionRow(cond) {
  const list = document.getElementById("conditionsList");
  const row = document.createElement("div");
  row.className = "cond-row";

  const field = document.createElement("input");
  field.className = "cond-field";
  field.placeholder = "field, e.g. data.temperature";
  field.value = cond?.field ?? "";

  const op = document.createElement("select");
  op.className = "cond-op";
  OPERATORS.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.v;
    opt.textContent = o.label;
    if (cond?.operator === o.v) opt.selected = true;
    op.appendChild(opt);
  });

  const value = document.createElement("input");
  value.className = "cond-value";
  value.placeholder = "value";
  value.value = cond?.value ?? "";
  if (cond?.operator === "exists" || cond?.operator === "not_exists") value.disabled = true;
  op.addEventListener("change", () => {
    value.disabled = op.value === "exists" || op.value === "not_exists";
  });

  const del = document.createElement("button");
  del.className = "btn btn-small btn-danger";
  del.textContent = "✕";
  del.onclick = () => row.remove();

  row.appendChild(field);
  row.appendChild(op);
  row.appendChild(value);
  row.appendChild(del);
  list.appendChild(row);
}

// ---------------------------------------------------------------------------
// Builder: actions
// ---------------------------------------------------------------------------
function addActionRow(action) {
  const list = document.getElementById("actionsList");
  const type = action?.type ?? "command";
  const row = document.createElement("div");
  row.className = "action-row";

  const typeSel = document.createElement("select");
  typeSel.className = "action-type";
  [
    ["command", "MQTT Command"],
    ["notify", "Notification (log entry)"],
    ["webhook", "Webhook (HTTP POST)"]
  ].forEach(([v, label]) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = label;
    if (type === v) opt.selected = true;
    typeSel.appendChild(opt);
  });

  // command fields
  const cmdSpan = document.createElement("span");
  cmdSpan.className = "action-fields action-fields-command";
  cmdSpan.innerHTML = `
    <select class="cmd-device">
      <option value="LIGHT">LIGHT</option>
      <option value="DOOR">DOOR</option>
      <option value="MOTION_SENSOR">MOTION_SENSOR</option>
      <option value="RFID_READER">RFID_READER</option>
      <option value="SYSTEM">SYSTEM</option>
    </select>
    <input type="number" class="cmd-id" value="1" min="0" title="Device ID">
    <input type="text" class="cmd-action" placeholder="e.g. ON" title="Action">
    <input type="text" class="cmd-data" value="{}" title='Data (JSON)'>
    <input type="number" class="cmd-duration" placeholder="sec" min="0" step="0.5" title="Auto-revert after N seconds (empty = stays on)">
    <input type="text" class="cmd-off" placeholder="off cmd (OFF/CLOSE)" title="Revert command sent after the duration">`;
  cmdSpan.querySelector(".cmd-device").value = action?.device ?? "LIGHT";
  if (action?.id !== undefined && action?.id !== null) cmdSpan.querySelector(".cmd-id").value = action.id;
  cmdSpan.querySelector(".cmd-action").value = action?.action ?? "";
  cmdSpan.querySelector(".cmd-data").value = JSON.stringify(action?.data ?? {});
  if (action?.durationSec) cmdSpan.querySelector(".cmd-duration").value = action.durationSec;
  cmdSpan.querySelector(".cmd-off").value = action?.offAction ?? "";

  // notify fields
  const notifySpan = document.createElement("span");
  notifySpan.className = "action-fields action-fields-notify";
  notifySpan.innerHTML = `<input type="text" class="notify-msg flex-grow" placeholder="message shown in the log stream">`;
  notifySpan.querySelector(".notify-msg").value = action?.message ?? "";

  // webhook fields
  const hookSpan = document.createElement("span");
  hookSpan.className = "action-fields action-fields-webhook";
  hookSpan.innerHTML = `<input type="text" class="hook-url flex-grow" placeholder="https://example.com/hook">`;
  hookSpan.querySelector(".hook-url").value = action?.url ?? "";

  const del = document.createElement("button");
  del.className = "btn btn-small btn-danger";
  del.textContent = "✕";
  del.onclick = () => row.remove();

  typeSel.addEventListener("change", () => syncActionFields(row));
  row.appendChild(typeSel);
  row.appendChild(cmdSpan);
  row.appendChild(notifySpan);
  row.appendChild(hookSpan);
  row.appendChild(del);
  syncActionFields(row);
  list.appendChild(row);
}

function syncActionFields(row) {
  const type = row.querySelector(".action-type").value;
  row.querySelector(".action-fields-command").style.display = type === "command" ? "flex" : "none";
  row.querySelector(".action-fields-notify").style.display = type === "notify" ? "flex" : "none";
  row.querySelector(".action-fields-webhook").style.display = type === "webhook" ? "flex" : "none";
}

// ---------------------------------------------------------------------------
// Builder: collect / fill / reset
// ---------------------------------------------------------------------------
function collectRule() {
  const matchIdRaw = document.getElementById("matchId").value.trim();
  return {
    name: document.getElementById("ruleName").value.trim(),
    enabled: document.getElementById("ruleEnabled").checked,
    cooldownSec: parseFloat(document.getElementById("ruleCooldown").value) || 0,
    match: {
      device: document.getElementById("matchDevice").value,
      id: matchIdRaw === "" ? null : parseInt(matchIdRaw, 10)
    },
    logic: document.getElementById("ruleLogic").value,
    conditions: [...document.querySelectorAll("#conditionsList .cond-row")].map(row => ({
      field: row.querySelector(".cond-field").value.trim(),
      operator: row.querySelector(".cond-op").value,
      value: row.querySelector(".cond-value").value
    })),
    actions: [...document.querySelectorAll("#actionsList .action-row")].map(row => {
      const type = row.querySelector(".action-type").value;
      if (type === "command") {
        let data = {};
        try { data = JSON.parse(row.querySelector(".cmd-data").value || "{}"); }
        catch (e) { throw new Error("Invalid JSON in command Data field"); }
        return {
          type,
          device: row.querySelector(".cmd-device").value,
          id: parseInt(row.querySelector(".cmd-id").value, 10) || 0,
          action: row.querySelector(".cmd-action").value.trim(),
          data,
          durationSec: parseFloat(row.querySelector(".cmd-duration").value) || 0,
          offAction: row.querySelector(".cmd-off").value.trim()
        };
      }
      if (type === "notify") {
        return { type, message: row.querySelector(".notify-msg").value };
      }
      return { type, url: row.querySelector(".hook-url").value.trim() };
    })
  };
}

function fillBuilder(rule) {
  resetBuilder();
  editingId = rule.id;
  document.getElementById("ruleName").value = rule.name ?? "";
  document.getElementById("ruleEnabled").checked = rule.enabled ?? true;
  document.getElementById("ruleCooldown").value = rule.cooldownSec ?? 0;
  document.getElementById("matchDevice").value = rule.match?.device ?? "";
  document.getElementById("matchId").value = rule.match?.id ?? "";
  document.getElementById("ruleLogic").value = rule.logic ?? "AND";
  (rule.conditions ?? []).forEach(c => addConditionRow(c));
  (rule.actions ?? []).forEach(a => addActionRow(a));
  updateBuilderBadge();
  document.getElementById("testSample").value = JSON.stringify(
    { device: "MOTION_SENSOR", id: 1, action: "MOTION", data: { temperature: 31.5 } }, null, 2
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetBuilder() {
  editingId = null;
  document.getElementById("ruleName").value = "";
  document.getElementById("ruleEnabled").checked = true;
  document.getElementById("ruleCooldown").value = 0;
  document.getElementById("matchDevice").value = "";
  document.getElementById("matchId").value = "";
  document.getElementById("ruleLogic").value = "AND";
  document.getElementById("conditionsList").innerHTML = "";
  document.getElementById("actionsList").innerHTML = "";
  document.getElementById("testResult").classList.add("hidden");
  updateBuilderBadge();
}

function updateBuilderBadge() {
  const badge = document.getElementById("builderMode");
  badge.textContent = editingId ? "EDIT" : "NEW";
  badge.className = editingId ? "tag tag-edit" : "tag tag-cmd";
}

// ---------------------------------------------------------------------------
// API operations
// ---------------------------------------------------------------------------
async function saveRule() {
  let payload;
  try {
    payload = collectRule();
  } catch (e) {
    showToast(`Error: ${e.message}`);
    return;
  }
  if (!payload.name) { showToast("Error: Rule name is required"); return; }
  if (payload.actions.length === 0) { showToast("Error: Add at least one action"); return; }

  try {
    const url = editingId ? `/api/rules/${editingId}` : "/api/rules";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "ok") {
      showToast(editingId ? "Rule updated" : "Rule created");
      resetBuilder();
      loadRules();
    } else {
      showToast(`Error: ${result.message || "Failed"}`);
    }
  } catch (err) {
    showToast("Network Error: Could not reach web server");
  }
}

async function toggleRule(id) {
  try {
    await fetch(`/api/rules/${id}/toggle`, { method: "POST" });
    loadRules();
  } catch (err) {
    showToast("Network Error: Could not reach web server");
  }
}

async function deleteRule(id, name) {
  if (!confirm(`Delete rule "${name}"?`)) return;
  try {
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    if (editingId === id) resetBuilder();
    showToast("Rule deleted");
    loadRules();
  } catch (err) {
    showToast("Network Error: Could not reach web server");
  }
}

function editRule(id) {
  const rule = rules.find(r => r.id === id);
  if (rule) fillBuilder(rule);
}

async function testRule() {
  const resultBox = document.getElementById("testResult");
  let sample;
  try {
    sample = JSON.parse(document.getElementById("testSample").value);
  } catch (e) {
    showToast("Error: Sample log is not valid JSON");
    return;
  }
  let payload;
  try {
    payload = collectRule();
  } catch (e) {
    showToast(`Error: ${e.message}`);
    return;
  }

  try {
    const res = await fetch("/api/rules/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rule: payload, sample })
    });
    const result = await res.json();
    if (result.status !== "ok") {
      showToast(`Error: ${result.message || "Failed"}`);
      return;
    }
    const r = result.result;
    resultBox.classList.remove("hidden");
    resultBox.className = r.matched ? "test-ok" : "test-fail";
    const condLines = r.conditionResults.map(c =>
      `  ${c.passed ? "✔" : "✘"} ${c.field} ${c.operator} ${JSON.stringify(c.expected)}  (actual: ${JSON.stringify(c.actual)})`
    ).join("\n");
    resultBox.textContent =
      `${r.matched ? "✔ RULE WOULD FIRE" : "✘ Rule would NOT fire"}\n` +
      `match-block ok: ${r.matchBlockOk}\nconditions:\n${condLines || "  (none - always matches)"}`;
  } catch (err) {
    showToast("Network Error: Could not reach web server");
  }
}

function toggleTestArea() {
  document.getElementById("testArea").classList.toggle("hidden");
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function describeMatch(rule) {
  const parts = [];
  parts.push(rule.match?.device ? rule.match.device : "any device");
  if (rule.match?.id !== null && rule.match?.id !== undefined) parts.push(`#${rule.match.id}`);
  return parts.join(" ");
}

function describeCondition(c) {
  const val = c.operator.includes("exists") ? "" : ` ${JSON.stringify(c.value)}`;
  return `${c.field} ${c.operator}${val}`;
}

function describeAction(a) {
  if (a.type === "command") {
    const timed = a.durationSec > 0 ? ` (${a.durationSec}s → ${a.offAction})` : "";
    return `MQTT: ${a.device} ${a.id} → ${a.action}${timed}`;
  }
  if (a.type === "notify") return `Notify: ${a.message || "(no message)"}`;
  return `Webhook: ${a.url}`;
}

function renderRules() {
  const tbody = document.getElementById("rulesBody");
  if (rules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No rules defined yet. Create one above.</td></tr>';
    return;
  }

  tbody.innerHTML = rules.map(r => {
    const whenParts = [`on ${esc(describeMatch(r))}`];
    if (r.conditions?.length) {
      const joiner = r.logic === "OR" ? " OR " : " AND ";
      whenParts.push(r.conditions.map(c => esc(describeCondition(c))).join(joiner));
    }
    const then = (r.actions ?? []).map(a => esc(describeAction(a))).join("<br>");

    return `<tr>
      <td><b>${esc(r.name)}</b><br><small style="color:#666;">cooldown ${r.cooldownSec ?? 0}s</small></td>
      <td>${whenParts.join("<br>")}</td>
      <td>${then}</td>
      <td>${r.triggerCount ?? 0}</td>
      <td>
        <label class="switch-label">
          <input type="checkbox" ${r.enabled ? "checked" : ""} onchange="toggleRule('${r.id}')">
          ${r.enabled ? "on" : "off"}
        </label>
      </td>
      <td class="row-actions">
        <button class="btn btn-small" onclick="editRule('${r.id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteRule('${r.id}', '${esc(r.name)}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

function renderEvents() {
  const tbody = document.getElementById("eventsBody");
  if (events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No rules triggered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = events.map(ev => {
    const trigger = ev.trigger ?? {};
    const dataStr = trigger.data && Object.keys(trigger.data).length > 0
      ? ` <code>${esc(JSON.stringify(trigger.data))}</code>` : "";
    const actionsHtml = (ev.actions ?? []).map(a => {
      const cls = a.status === "ok" || a.status === "sent" ? "status-ok" : "status-fail";
      const detail = a.detail ? ` <small style="color:#666;">${esc(a.detail)}</small>` : "";
      return `<div><span class="${cls}">●</span> ${esc(a.type)} (${esc(a.status)})${detail}</div>`;
    }).join("");

    return `<tr>
      <td>${esc(ev.time)}</td>
      <td><b>${esc(ev.ruleName)}</b></td>
      <td>${esc(trigger.device ?? "-")} ${trigger.id !== null && trigger.id !== undefined && trigger.id !== "" ? esc(trigger.id) : ""}
          <code>${esc(trigger.action ?? "-")}</code>${dataStr}</td>
      <td>${actionsHtml}</td>
    </tr>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadRules() {
  try {
    const res = await fetch("/api/rules");
    rules = await res.json();
    renderRules();
  } catch (e) { /* server unreachable */ }
}

async function loadEvents() {
  try {
    const res = await fetch("/api/rules/events");
    events = await res.json();
    renderEvents();
  } catch (e) { /* server unreachable */ }
}

window.onload = () => {
  resetBuilder();
  addConditionRow();
  addActionRow();
  loadRules();
  loadEvents();
  setInterval(() => { loadRules(); loadEvents(); }, 5000);
};
