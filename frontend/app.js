// =========================
// GLOBALS
// =========================
let map;
let nodeLayer;
let linkLayer;
let currentNodes = [];

// =========================
// SECTION NAVIGATION
// =========================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-item[data-section]').forEach(a => a.classList.remove('active'));

  const section = document.getElementById(id);
  if (section) section.style.display = 'block';

  const navLink = document.querySelector(`.nav-item[data-section="${id}"]`);
  if (navLink) navLink.classList.add('active');

  if (id === 'deployment') {
    setTimeout(() => {
      if (!window.mapInitialized) { initMap(); window.mapInitialized = true; }
      else if (map) { map.invalidateSize(); }
    }, 200);
  }

  if (id === 'dashboard') {
    if (!window.chartInitialized) { initDashboardCharts(); window.chartInitialized = true; }
  }

  if (id === 'settings') {
    loadSettings();
  }
}

// =========================
// THEME TOGGLE
// =========================
function toggleTheme() {
  const isDark = !AppState.darkMode;
  AppState.setDarkMode(isDark);
  _updateThemeBtn(isDark);
}

function _updateThemeBtn(isDark) {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  } else {
    btn.innerText = isDark ? '☀️' : '🌙';
  }
}

// =========================
// NODE SELECTOR
// =========================
function onNodeSelectChange() {
  AppState.selectedNodeId = document.getElementById('nodeSelect').value;
  updateDashboard();
}

// =========================
// MAP INIT
// =========================
function initMap() {
  map = L.map('deploymentMap').setView([27.4924, 77.6737], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  nodeLayer = L.layerGroup().addTo(map);
  linkLayer = L.layerGroup().addTo(map);

  loadDeployment();
  setInterval(loadDeployment, 30000);
}

// =========================
// LOAD DEPLOYMENT
// =========================
function loadDeployment() {
  fetch('/deployment-status')
    .then(res => res.json())
    .then(data => {
      renderNodes(data.nodes);
      renderLinks(data.links);
      updateAI(data.ai);
      showDeploymentAlerts(data.alerts);
      renderLinkControls(data.links);
      // Surface auto-routing events to alert log
      (data.routingEvents || []).forEach(msg => {
        AppState.addAlert(msg, 'warning');
      });
      renderAlertLog();
    })
    .catch(err => console.error('Deployment error:', err));
}

// =========================
// NODES
// =========================
function renderNodes(nodes) {
  nodeLayer.clearLayers();
  currentNodes = nodes;

  nodes.forEach(node => {
    let color = node.type === 'wetland' ? '#16a34a' : '#2563eb';
    if (node.quality < 0.65) color = '#dc2626';

    const flowPct    = node.flow    != null ? (node.flow    * 100).toFixed(0) + '%' : '--';
    const qualityPct = node.quality != null ? (node.quality * 100).toFixed(0) + '%' : '--';
    const capacityNote = node.capacity != null
      ? `<br>Capacity: ${(node.capacity * 100).toFixed(0)}%`
      : '';
    const tooltipHtml = `<b>${node.name}</b><br>Type: ${node.type}<br>Flow: ${flowPct}<br>Quality: ${qualityPct}${capacityNote}`;

    L.circleMarker([node.lat, node.lng], {
      radius: 9,
      color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2
    })
    .bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -8] })
    .addTo(nodeLayer)
    .on('click', () => openNodePanel(node.id));
  });
}

// =========================
// LINKS
// =========================
function renderLinks(links) {
  linkLayer.clearLayers();
  links.forEach(link => {
    const from = currentNodes.find(n => n.id === link.from);
    const to   = currentNodes.find(n => n.id === link.to);
    if (from && to) {
      const color = link.status === 'closed'    ? '#dc2626'
                  : link.status === 'throttled' ? '#f59e0b'
                  : '#6b7280';
      L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
        color,
        weight: 3,
        dashArray: link.status === 'throttled' ? '6,4' : null,
      })
      .bindTooltip(`${link.id}: ${link.from}→${link.to} | ${link.status} | flow: ${(link.flow * 100).toFixed(0)}%`)
      .addTo(linkLayer);
    }
  });
}

// =========================
// LINK CONTROLS TABLE
// =========================
function renderLinkControls(links) {
  const tbody = document.getElementById('linkTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (links || []).forEach(link => {
    const fromNode = currentNodes.find(n => n.id === link.from);
    const toNode   = currentNodes.find(n => n.id === link.to);
    const fromName = fromNode ? fromNode.name : link.from;
    const toName   = toNode   ? toNode.name   : link.to;
    const flowPct  = Math.round((link.flow || 0) * 100);
    const statusCls = link.status === 'open'      ? 'badge-safe'
                    : link.status === 'throttled' ? 'badge-moderate'
                    : 'badge-unsafe';
    const flowBarColor = link.status === 'closed'    ? '#dc2626'
                       : link.status === 'throttled' ? '#f59e0b'
                       : '#16a34a';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><b>${link.id}</b></td>
      <td class="route-cell">${fromName} → ${toName}</td>
      <td><span class="status-badge ${statusCls}">${link.status}</span></td>
      <td>
        <div class="flow-bar-wrap"><div class="flow-bar" style="width:${flowPct}%;background:${flowBarColor}"></div></div>
        <span class="flow-pct">${flowPct}%</span>
      </td>
      <td class="controls-cell">
        <button onclick="controlLink('${link.id}','transfer')" class="btn-ctrl btn-open"   title="Open / maximize flow">▶ Open</button>
        <button onclick="controlLink('${link.id}','retain')"   class="btn-ctrl btn-throttle" title="Throttle flow">⏸ Throttle</button>
        <button onclick="controlLink('${link.id}','stop')"     class="btn-ctrl btn-stop"   title="Stop flow">■ Stop</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function controlLink(linkId, action) {
  try {
    const res  = await fetch('/deployment-control', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ linkId, action }),
    });
    const data = await res.json();
    if (!res.ok) { console.error('Control error:', data.error); return; }
    const actionLabels = { stop: 'Stopped', transfer: 'Opened', retain: 'Throttled' };
    AppState.addAlert(`Manual: ${actionLabels[action] || action} link ${linkId}`, 'info');
    renderAlertLog();
    loadDeployment();
  } catch (err) {
    console.error('controlLink error:', err);
  }
}

// =========================
// DASHBOARD UPDATE
// =========================
function updateDashboard() {
  const url = AppState.selectedNodeId
    ? '/latest-data?nodeId=' + AppState.selectedNodeId
    : '/latest-data';

  fetch(url)
    .then(res => {
      if (!res.ok) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;
      AppState.latestData = data;

      setCard('phValue',           data.ph,              'ph');
      setCard('turbidityValue',    data.turbidity,       'turbidity');
      setCard('tempValue',         data.temperature,     'temperature', '°C');
      setCard('doValue',           data.dissolvedOxygen, 'dissolvedOxygen', ' mg/L');
      setCard('conductivityValue', data.conductivity,    'conductivity', ' µS/cm');
      setCard('tdsValue',          data.tds,             'tds', ' mg/L');
      setCard('statusValue',       data.status ? data.status.toUpperCase() : '--', null);
      setActionCard(data.action);

      showDashboardAlerts(data);
      updateDashboardCharts(data);
      updateTimestamp();
    })
    .catch(() => {});
}

function setCard(elId, value, param, suffix) {
  const el = document.getElementById(elId);
  if (!el) return;
  const formatted = value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--';
  el.textContent = formatted + (suffix && value != null ? suffix : '');

  if (param) {
    const status = AppState.classifyParam(param, value);
    el.className = 'card-value status-' + status;
  }
}

function setActionCard(action) {
  const el = document.getElementById('actionValue');
  if (!el) return;
  const labels = { 'reuse': '✅ Reuse', 'irrigation': '⚠️ Irrigation', 're-treat': '❌ Re-treat' };
  const cls    = { 'reuse': 'status-safe', 'irrigation': 'status-moderate', 're-treat': 'status-unsafe' };
  el.textContent = labels[action] || (action ? action : '--');
  el.className   = 'card-value ' + (cls[action] || '');
}

function updateTimestamp() {
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
}

// =========================
// DASHBOARD ALERTS
// =========================
function showDashboardAlerts(data) {
  const panel = document.getElementById('dashboardAlerts');
  if (!panel) return;
  panel.innerHTML = '';

  const checks = [
    ['ph',              data.ph,              'pH'],
    ['turbidity',       data.turbidity,       'Turbidity'],
    ['temperature',     data.temperature,     'Temperature'],
    ['dissolvedOxygen', data.dissolvedOxygen, 'Dissolved Oxygen'],
    ['conductivity',    data.conductivity,    'Conductivity'],
    ['tds',             data.tds,             'TDS'],
  ];

  checks.forEach(([param, value, label]) => {
    if (value == null) return;
    const cls = AppState.classifyParam(param, value);
    const formatted = typeof value === 'number' ? value.toFixed(2) : value;
    if (cls === 'unsafe') {
      createBanner(panel, `⚠ ${label} is UNSAFE (${formatted})`, 'danger');
      AppState.addAlert(`${label} UNSAFE: ${formatted}`, 'danger');
      renderAlertLog();
    } else if (cls === 'moderate') {
      createBanner(panel, `⚡ ${label} is MODERATE (${formatted})`, 'warning');
    }
  });
}

function createBanner(panel, msg, type) {
  const div = document.createElement('div');
  div.className = 'notification-banner ' + type;
  div.textContent = msg;
  panel.appendChild(div);
}

// =========================
// ALERT LOG
// =========================
function renderAlertLog() {
  const list = document.getElementById('alertLogList');
  if (!list) return;
  if (AppState.alertLog.length === 0) {
    list.innerHTML = '<p class="no-alerts">No alerts recorded yet.</p>';
    return;
  }
  list.innerHTML = AppState.alertLog.slice(0, 30).map(a => {
    const cls = a.type === 'danger' ? 'alert-danger' : a.type === 'warning' ? 'alert-warning' : 'alert-info';
    return `<div class="alert-log-item ${cls}">
      <span class="alert-time">${a.time}</span>
      <span class="alert-msg">${a.message}</span>
    </div>`;
  }).join('');
}

function clearAlertLog() {
  AppState.alertLog = [];
  renderAlertLog();
}

// =========================
// DEPLOYMENT ALERTS
// =========================
function showDeploymentAlerts(alerts) {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;
  panel.innerHTML = '';
  (alerts || []).forEach(alert => {
    createBanner(panel, alert.message, 'danger');
  });
}

// =========================
// AI PANEL
// =========================
function updateAI(ai) {
  const list = document.getElementById('aiList');
  if (!list) return;
  list.innerHTML = '';
  (ai.recommendations || []).forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    list.appendChild(li);
  });
}

// =========================
// BOOT
// =========================
async function boot() {
  AppState.init();
  updateAuthUI();

  // Apply saved dark mode button state
  _updateThemeBtn(AppState.darkMode);

  // Load thresholds first so card colouring is available
  await loadSettings();

  showSection('dashboard');
  initDashboardCharts();
  window.chartInitialized = true;

  // Start polling dashboard immediately, then every 5 seconds per spec
  updateDashboard();
  setInterval(updateDashboard, AppState.refreshInterval);
}

document.addEventListener('DOMContentLoaded', boot);

