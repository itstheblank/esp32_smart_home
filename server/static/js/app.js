let logs = [];

function showToast(text) {
  const t = document.getElementById("toast");
  t.innerText = text;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 2200);
}

async function sendQuick(device, id, action) {
  await postCommand({ device, id, action, data: {} });
}

async function sendCustom() {
  const device = document.getElementById("custDevice").value;
  const id = parseInt(document.getElementById("custId").value, 10) || 0;
  const action = document.getElementById("custAction").value.trim();
  let data = {};
  try {
    const dataStr = document.getElementById("custData").value.trim();
    if (dataStr) data = JSON.parse(dataStr);
  } catch (e) {
    alert("Invalid JSON in Data field!");
    return;
  }
  await postCommand({ device, id, action, data });
}

async function postCommand(payload) {
  try {
    const res = await fetch("/api/cmd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "ok") {
      showToast(`Sent ${payload.device} -> ${payload.action}`);
    } else {
      showToast(`Error: ${result.message || "Failed"}`);
    }
  } catch (err) {
    showToast("Network Error: Could not reach web server");
  }
}

async function clearLogs() {
  logs = [];
  renderLogs();
  fetch("/api/clear", { method: "POST" });
}

function renderLogs() {
  const filter = document.getElementById("filterDevice").value;
  const tbody = document.getElementById("logsBody");
  const filtered = logs.filter(l => filter === "ALL" || l.device === filter);

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No logs matching filter.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isCmd = item.topic && item.topic.includes("cmd");
    const topicTag = isCmd 
      ? '<span class="tag tag-cmd">CMD</span>' 
      : '<span class="tag tag-log">LOG</span>';
    
    let statusHtml = "-";
    if (item.success === true) statusHtml = '<span class="status-ok">✔ true</span>';
    else if (item.success === false) statusHtml = '<span class="status-fail">✘ false</span>';

    let dataStr = "";
    if (item.data && Object.keys(item.data).length > 0) {
      dataStr = `<code>${JSON.stringify(item.data)}</code>`;
    }

    return `<tr class="${isCmd ? 'row-cmd' : 'row-log'}">
      <td>${item.time || ''}</td>
      <td>${topicTag} <small style="color:#666;">${item.topic || ''}</small></td>
      <td><b>${item.device || '-'}</b></td>
      <td>${item.id !== undefined && item.id !== '' ? item.id : '-'}</td>
      <td><code>${item.action || '-'}</code></td>
      <td>${statusHtml}</td>
      <td>${dataStr}</td>
    </tr>`;
  }).join('');
}

function initSSE() {
  const evtSource = new EventSource("/api/stream");
  const badge = document.getElementById("statusBadge");

  evtSource.onopen = () => {
    badge.className = "badge badge-online";
    badge.innerText = "Connected";
  };

  evtSource.onerror = () => {
    badge.className = "badge badge-offline";
    badge.innerText = "Reconnecting...";
  };

  evtSource.onmessage = (event) => {
    try {
      const entry = JSON.parse(event.data);
      logs.unshift(entry);
      if (logs.length > 300) logs.pop();
      renderLogs();
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  };
}

window.onload = async () => {
  initSSE();

  try {
    const res = await fetch("/api/info");
    const info = await res.json();
    document.getElementById("brokerInfo").innerText = `${info.broker}:${info.port}`;
  } catch (e) {}

  try {
    const res = await fetch("/api/logs");
    logs = await res.json();
    renderLogs();
  } catch (e) {}
};
