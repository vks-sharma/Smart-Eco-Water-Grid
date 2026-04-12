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
  document.querySelectorAll('.sidebar a[data-section]').forEach(a => a.classList.remove('active'));

  const section = document.getElementById(id);
  if (section) section.style.display = 'block';

  const navLink = document.querySelector(`.sidebar a[data-section="${id}"]`);
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
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerText = isDark ? '☀️' : '🌙';
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

    L.circleMarker([node.lat, node.lng], {
      radius: 9,
      color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2
    })
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
      L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
        color:  link.status === 'closed' ? '#dc2626' : link.status === 'throttled' ? '#f59e0b' : '#6b7280',
        weight: 3,
        dashArray: link.status === 'throttled' ? '6,4' : null,
      }).addTo(linkLayer);
    }
  });
}

// =========================
// DASHBOARD UPDATE
// =========================
function updateDashboard() {
  fetch('/latest-data')
    .then(res => {
      if (!res.ok) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;
      AppState.latestData = data;

      setCard('phValue',        data.ph,              'ph');
      setCard('turbidityValue', data.turbidity,        'turbidity');
      setCard('tempValue',      data.temperature,      'temperature', '°C');
      setCard('doValue',        data.dissolvedOxygen,  'dissolvedOxygen', ' mg/L');
      setCard('statusValue',    data.status ? data.status.toUpperCase() : '--', null);

      showDashboardAlerts(data);
      updateDashboardCharts(data);
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

// =========================
// DASHBOARD ALERTS
// =========================
function showDashboardAlerts(data) {
  const panel = document.getElementById('dashboardAlerts');
  if (!panel) return;
  panel.innerHTML = '';

  function check(param, value, label) {
    if (value == null) return;
    const cls = AppState.classifyParam(param, value);
    if (cls === 'unsafe')        createBanner(panel, `⚠ ${label} is UNSAFE (${value.toFixed ? value.toFixed(2) : value})`, 'danger');
    else if (cls === 'moderate') createBanner(panel, `⚡ ${label} is MODERATE (${value.toFixed ? value.toFixed(2) : value})`, 'warning');
  }

  check('ph',              data.ph,              'pH');
  check('turbidity',       data.turbidity,       'Turbidity');
  check('temperature',     data.temperature,     'Temperature');
  check('dissolvedOxygen', data.dissolvedOxygen, 'Dissolved Oxygen');
  check('conductivity',    data.conductivity,    'Conductivity');
}

function createBanner(panel, msg, type) {
  const div = document.createElement('div');
  div.className = 'notification-banner ' + type;
  div.textContent = msg;
  panel.appendChild(div);
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
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.innerText = AppState.darkMode ? '☀️' : '🌙';

  // Load thresholds first so card colouring is available
  await loadSettings();

  showSection('dashboard');

  // Start polling dashboard immediately, then every 5 minutes
  updateDashboard();
  setInterval(updateDashboard, AppState.refreshInterval);
}

document.addEventListener('DOMContentLoaded', boot);
