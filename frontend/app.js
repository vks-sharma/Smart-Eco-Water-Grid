// =========================
// GLOBALS
// =========================
let map;
let nodeLayer;
let linkLayer;
let currentNodes = [];
let _notifOpen = false;

// =========================
// SECTION NAVIGATION
// =========================
function showSection(id) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('section-visible');
    s.style.display = 'none';
  });
  document.querySelectorAll('.nav-item[data-section]').forEach(a => a.classList.remove('active'));

  const section = document.getElementById(id);
  if (section) {
    section.style.display = 'block';
    // Trigger reflow for transition
    void section.offsetWidth;
    section.classList.add('section-visible');
  }

  const navLink = document.querySelector(`.nav-item[data-section="${id}"]`);
  if (navLink) navLink.classList.add('active');

  // Close sidebar on mobile after nav
  if (window.innerWidth <= 768) closeSidebar();

  if (id === 'deployment') {
    setTimeout(() => {
      if (!window.mapInitialized) { initMap(); window.mapInitialized = true; }
      else if (map) { map.invalidateSize(); }
    }, 200);
  }

  if (id === 'dashboard') {
    if (!window.chartInitialized) {
      try { initDashboardCharts(); } catch(e) { console.warn('Charts unavailable:', e.message); }
      window.chartInitialized = true;
    }
  }

  if (id === 'settings') {
    loadSettings();
  }
}

// =========================
// SIDEBAR TOGGLE
// =========================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;

  if (window.innerWidth <= 768) {
    // Mobile: drawer behavior
    const isOpen = sidebar.classList.contains('sidebar-open');
    if (isOpen) closeSidebar();
    else {
      sidebar.classList.add('sidebar-open');
      overlay.classList.add('overlay-visible');
    }
  }
  // Desktop: could add collapse logic here if desired
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (overlay) overlay.classList.remove('overlay-visible');
}

// =========================
// THEME TOGGLE
// =========================
function toggleTheme() {
  const isDark = !AppState.darkMode;
  AppState.setDarkMode(isDark);
  _updateThemeBtn(isDark);
  // Animate theme transition
  document.body.style.transition = 'background 0.4s ease, color 0.4s ease';
}

function _updateThemeBtn(isDark) {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

// =========================
// TOAST NOTIFICATIONS
// =========================
const _toastQueue = [];
let _toastCount = 0;
const MAX_TOASTS = 3;

const TOAST_ICONS = {
  success: '<i class="fa-solid fa-circle-check toast-icon"></i>',
  warning: '<i class="fa-solid fa-triangle-exclamation toast-icon"></i>',
  error:   '<i class="fa-solid fa-circle-xmark toast-icon"></i>',
  info:    '<i class="fa-solid fa-circle-info toast-icon"></i>',
};

function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 4000;

  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Remove oldest if at max
  const existing = container.querySelectorAll('.toast');
  if (existing.length >= MAX_TOASTS) {
    dismissToast(existing[0]);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = (TOAST_ICONS[type] || '') + `<span class="toast-msg">${message}</span>`;
  toast.onclick = () => dismissToast(toast);

  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;
}

function dismissToast(toast) {
  if (!toast || toast._dismissing) return;
  toast._dismissing = true;
  clearTimeout(toast._timer);
  toast.classList.add('toast-out');
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
}

// =========================
// NOTIFICATION BELL
// =========================
function toggleNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  const btn = document.getElementById('notifBellBtn');
  if (!dropdown || !btn) return;

  _notifOpen = !_notifOpen;
  dropdown.style.display = _notifOpen ? 'block' : 'none';

  if (_notifOpen) {
    renderNotifDropdown();
    // Remove badge when opened
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', _closeNotifOutside, { once: true, capture: true });
    }, 0);
  }
}

function _closeNotifOutside(e) {
  const wrap = document.getElementById('notifBellWrap');
  if (wrap && !wrap.contains(e.target)) {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.style.display = 'none';
    _notifOpen = false;
  }
}

function renderNotifDropdown() {
  const list = document.getElementById('notifDropdownList');
  if (!list) return;
  if (AppState.alertLog.length === 0) {
    list.innerHTML = '<p class="no-alerts">No alerts recorded yet.</p>';
    return;
  }
  list.innerHTML = AppState.alertLog.slice(0, 20).map(a => {
    const cls = a.type === 'danger' ? 'alert-danger' : a.type === 'warning' ? 'alert-warning' : 'alert-info';
    return `<div class="alert-log-item ${cls}">
      <span class="alert-time">${a.time}</span>
      <span class="alert-msg">${a.message}</span>
    </div>`;
  }).join('');
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  const btn   = document.getElementById('notifBellBtn');
  if (!badge || !btn) return;

  const count = AppState.alertLog.filter(a => a.type === 'danger').length;
  if (count > 0 && !_notifOpen) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'flex';
    btn.classList.add('has-alerts');
    setTimeout(() => btn.classList.remove('has-alerts'), 700);
  } else {
    badge.style.display = 'none';
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
  map = L.map('deploymentMap', { zoomAnimation: true, fadeAnimation: true }).setView([27.4924, 77.6737], 13);

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
// NODES (animated markers)
// =========================
function renderNodes(nodes) {
  nodeLayer.clearLayers();
  currentNodes = nodes;

  nodes.forEach(node => {
    let color = node.type === 'wetland' ? '#16a34a' : '#2563eb';
    if (node.quality < 0.65) color = '#dc2626';
    else if (node.quality < 0.80) color = '#f59e0b';

    const flowPct    = node.flow    != null ? (node.flow    * 100).toFixed(0) + '%' : '--';
    const qualityPct = node.quality != null ? (node.quality * 100).toFixed(0) + '%' : '--';
    const capacityNote = node.capacity != null
      ? `<br>Capacity: ${(node.capacity * 100).toFixed(0)}%`
      : '';
    const tooltipHtml = `<b>${node.name}</b><br>Type: ${node.type}<br>Flow: ${flowPct}<br>Quality: ${qualityPct}${capacityNote}`;

    const isCritical = node.quality < 0.65;
    const isModerate = node.quality >= 0.65 && node.quality < 0.80;

    const marker = L.circleMarker([node.lat, node.lng], {
      radius: 9,
      color,
      fillColor: color,
      fillOpacity: 0.85,
      weight: 2,
    })
    .bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -8] })
    .addTo(nodeLayer)
    .on('click', () => openNodePanel(node.id));

    // Add pulsing ring via a separate circle for critical/moderate
    if (isCritical || isModerate) {
      const pulseRadius = isCritical ? 16 : 12;
      L.circleMarker([node.lat, node.lng], {
        radius: pulseRadius,
        color,
        fillColor: 'transparent',
        fillOpacity: 0,
        weight: 1.5,
        opacity: 0.5,
        className: 'map-pulse-ring',
      }).addTo(nodeLayer);
    }
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
                  : '#16a34a';
      const dashArray = link.status === 'throttled' ? '8,5' :
                        link.status === 'closed'    ? '4,4' : null;
      L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
        color,
        weight: link.status === 'open' ? 3 : 2.5,
        dashArray,
        opacity: link.status === 'closed' ? 0.7 : 1,
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
    const msg = `Manual: ${actionLabels[action] || action} link ${linkId}`;
    AppState.addAlert(msg, 'info');
    renderAlertLog();
    updateNotifBadge();
    showToast(msg, 'info', 3000);
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

// Count-up animation for card values
function animateValue(el, newVal, suffix) {
  if (!el || typeof newVal !== 'number') return;
  const startVal = parseFloat(el.dataset.rawValue) || 0;
  el.dataset.rawValue = newVal;
  const duration = 800;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (newVal - startVal) * ease;
    el.textContent = current.toFixed(2) + (suffix && newVal != null ? suffix : '');
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function setCard(elId, value, param, suffix) {
  const el = document.getElementById(elId);
  if (!el) return;

  if (param && typeof value === 'number') {
    animateValue(el, value, suffix || '');
  } else {
    const formatted = value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--';
    el.textContent = formatted + (suffix && value != null ? suffix : '');
  }

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

  let hasNew = false;
  checks.forEach(([param, value, label]) => {
    if (value == null) return;
    const cls = AppState.classifyParam(param, value);
    const formatted = typeof value === 'number' ? value.toFixed(2) : value;
    if (cls === 'unsafe') {
      createBanner(panel, `⚠ ${label} is UNSAFE (${formatted})`, 'danger');
      // Only add to alert log if this is a new reading
      const lastMsg = AppState.alertLog[0] ? AppState.alertLog[0].message : '';
      const newMsg  = `${label} UNSAFE: ${formatted}`;
      if (lastMsg !== newMsg) {
        AppState.addAlert(newMsg, 'danger');
        hasNew = true;
        showToast(`${label} is UNSAFE: ${formatted}`, 'error', 5000);
      }
      renderAlertLog();
    } else if (cls === 'moderate') {
      createBanner(panel, `⚡ ${label} is MODERATE (${formatted})`, 'warning');
    }
  });

  if (hasNew) updateNotifBadge();
}

function createBanner(panel, msg, type) {
  const icon = type === 'danger' ? '🚨' : '⚡';
  const div = document.createElement('div');
  div.className = 'notification-banner ' + type;
  div.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
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
  renderNotifDropdown();
  updateNotifBadge();
  // Close dropdown after clearing
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) dropdown.style.display = 'none';
  _notifOpen = false;
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
  try { initDashboardCharts(); window.chartInitialized = true; } catch (e) { console.warn('Charts unavailable:', e.message); }

  // Start polling dashboard immediately, then every 5 seconds per spec
  updateDashboard();
  setInterval(updateDashboard, AppState.refreshInterval);
}

document.addEventListener('DOMContentLoaded', boot);
