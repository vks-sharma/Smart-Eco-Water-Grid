// frontend/app.js – Real-time water quality dashboard logic

// ─── Configuration ─────────────────────────────────────────────────────────────
const API_ENDPOINT = '/latest-data';
const REFRESH_INTERVAL = 3000; // 3 seconds as specified
const MAX_CHART_POINTS = 20;
const MAX_HISTORY_ROWS = 10;
const MAX_HISTORY_STORE = 100;

// pH safe range
const PH_MIN = 6.5;
const PH_MAX = 8.5;
// Turbidity thresholds
const TURB_SAFE = 5;
const TURB_MAX = 10;

// ─── State ────────────────────────────────────────────────────────────────────
let dataHistory = [];
let phChart = null;
let turbidityChart = null;
let refreshTimer = null;
let retryCount = 0;
const MAX_RETRIES = 3;
let isOnline = true;
let isDarkMode = false;
let lastStatus = null;

// ─── DOM helpers ──────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function animateValue(el, newValue) {
    if (!el) return;
    el.classList.remove('value-updated');
    // Trigger reflow so the animation restarts
    void el.offsetWidth;
    el.classList.add('value-updated');
    el.textContent = newValue;
}

// ─── Charts setup ─────────────────────────────────────────────────────────────
function initCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.7)',
                callbacks: {
                    label: ctx => ` ${ctx.parsed.y}`
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(128,128,128,0.15)' },
                ticks: { maxTicksLimit: 6, font: { size: 11 } }
            },
            y: {
                grid: { color: 'rgba(128,128,128,0.15)' },
                ticks: { font: { size: 11 } }
            }
        }
    };

    const phCtx = $('phChart');
    if (phCtx) {
        phChart = new Chart(phCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.12)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#667eea',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    y: {
                        ...chartDefaults.scales.y,
                        suggestedMin: 5,
                        suggestedMax: 10,
                        title: { display: true, text: 'pH', font: { size: 11 } }
                    }
                }
            }
        });
    }

    const turbCtx = $('turbidityChart');
    if (turbCtx) {
        turbidityChart = new Chart(turbCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245,87,108,0.12)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#f5576c',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    y: {
                        ...chartDefaults.scales.y,
                        suggestedMin: 0,
                        title: { display: true, text: 'NTU', font: { size: 11 } }
                    }
                }
            }
        });
    }
}

function updateCharts(ph, turbidity, label) {
    [phChart, turbidityChart].forEach((chart, i) => {
        if (!chart) return;
        const dataset = chart.data.datasets[0];
        chart.data.labels.push(label);
        dataset.data.push(i === 0 ? ph : turbidity);
        if (chart.data.labels.length > MAX_CHART_POINTS) {
            chart.data.labels.shift();
            dataset.data.shift();
        }
        chart.update('none');
    });
}

// ─── Progress bars ─────────────────────────────────────────────────────────────
function updateProgressBars(ph, turbidity) {
    // pH bar: 0–14 range, safe zone highlighted
    const phPct = Math.min(100, Math.max(0, (ph / 14) * 100));
    const phBar = $('phProgressBar');
    if (phBar) {
        phBar.style.width = phPct + '%';
        phBar.className = 'progress-fill ' + getPhClass(ph);
    }

    // Turbidity bar: 0–20 NTU capped
    const turbPct = Math.min(100, (turbidity / 20) * 100);
    const turbBar = $('turbProgressBar');
    if (turbBar) {
        turbBar.style.width = turbPct + '%';
        turbBar.className = 'progress-fill ' + getTurbClass(turbidity);
    }
}

// ─── Status helpers ────────────────────────────────────────────────────────────
function getPhClass(ph) {
    if (ph >= PH_MIN && ph <= PH_MAX) return 'good';
    if ((ph >= 6.0 && ph < PH_MIN) || (ph > PH_MAX && ph <= 9.0)) return 'warning';
    return 'danger';
}

function getTurbClass(t) {
    if (t < TURB_SAFE) return 'good';
    if (t < TURB_MAX) return 'warning';
    return 'danger';
}

function statusBadgeClass(status) {
    if (status === 'safe') return 'good';
    if (status === 'moderate') return 'warning';
    return 'danger';
}

function statusEmoji(status) {
    if (status === 'safe') return '✅';
    if (status === 'moderate') return '⚠️';
    return '🚨';
}

function actionLabel(action) {
    const map = { reuse: '♻️ Safe for reuse', irrigation: '🌱 Use for irrigation', 're-treat': '🔄 Requires re-treatment' };
    return map[action] || ('🔄 ' + (action || 'Unknown'));
}

// ─── Sidebar navigation ────────────────────────────────────────────────────────
// Expects sidebar menu items with data-target attributes, e.g.:
//   <a class="sidebar-link" data-target="dashboard">Dashboard</a>
// and corresponding sections with IDs:
//   dashboardSection, deploymentSection, settingsSection
function initSidebarNavigation() {
    const sectionsByKey = {
        dashboard: $('dashboardSection'),
        deployment: $('deploymentSection'),
        settings: $('settingsSection')
    };

    const showSection = (key) => {
        Object.entries(sectionsByKey).forEach(([k, el]) => {
            if (!el) return;
            el.style.display = (k === key) ? '' : 'none';
        });

        // Optional: active state on menu items
        const items = document.querySelectorAll('[data-target]');
        items.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-target') === key);
        });
    };

    const menuItems = document.querySelectorAll('[data-target]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (!target) return;
            showSection(target);
        });
    });

    // Default view
    showSection('dashboard');
}

// ─── Dashboard update ─────────────────────────────────────────────────────────
function updateDashboard(data) {
    const ph = parseFloat(data.ph);
    const turbidity = parseFloat(data.turbidity);
    const status = data.status || '';
    const action = data.action || '';
    const timeLabel = new Date().toLocaleTimeString();

    // ── Metric values ──
    animateValue($('phValue'), ph.toFixed(2));
    animateValue($('turbidityValue'), turbidity.toFixed(2));

    // ── pH status ──
    const phCls = getPhClass(ph);
    const phStatusEl = $('phStatus');
    if (phStatusEl) {
        const labels = { good: '✓ Optimal', warning: '⚠ Acceptable', danger: '✗ Poor' };
        phStatusEl.textContent = labels[phCls] || '--';
        phStatusEl.className = 'card-status status-' + phCls;
    }

    // ── Turbidity status ──
    const turbCls = getTurbClass(turbidity);
    const turbStatusEl = $('turbidityStatus');
    if (turbStatusEl) {
        const labels = { good: '✓ Clear', warning: '⚠ Slightly Turbid', danger: '✗ Very Turbid' };
        turbStatusEl.textContent = labels[turbCls] || '--';
        turbStatusEl.className = 'card-status status-' + turbCls;
    }

    // ── System status (from backend) ──
    const sysCls = statusBadgeClass(status);
    const statusValueEl = $('statusValue');
    const systemStatusEl = $('systemStatus');
    const actionEl = $('actionRecommendation');

    if (statusValueEl) {
        statusValueEl.textContent = statusEmoji(status) + ' ' + status.charAt(0).toUpperCase() + status.slice(1);
    }
    if (systemStatusEl) {
        systemStatusEl.textContent = status === 'safe' ? '✓ All Systems Normal' : status === 'moderate' ? '⚠ Moderate Quality' : '✗ Action Required';
        systemStatusEl.className = 'card-status status-' + sysCls;
        // Pulse on status change
        if (lastStatus && lastStatus !== status) {
            systemStatusEl.classList.add('pulse-badge');
            setTimeout(() => systemStatusEl.classList.remove('pulse-badge'), 1500);
        }
    }
    if (actionEl) {
        actionEl.textContent = actionLabel(action);
        actionEl.className = 'action-tag action-' + sysCls;
    }

    // ── Alert banner ──
    const alertBanner = $('alertBanner');
    if (alertBanner) {
        if (status === 'unsafe') {
            alertBanner.style.display = 'flex';
            alertBanner.innerHTML = '🚨 <strong>ALERT:</strong>&nbsp;Unsafe water quality detected! Immediate re-treatment required.';
        } else if (status === 'moderate') {
            alertBanner.style.display = 'flex';
            alertBanner.innerHTML = '⚠️ <strong>WARNING:</strong>&nbsp;Moderate water quality. Suitable for irrigation only.';
            alertBanner.className = 'alert-banner warning';
        } else {
            alertBanner.style.display = 'none';
            alertBanner.className = 'alert-banner danger';
        }
    }

    // ── Status card pulse on unsafe ──
    const statusCard = $('statusCard');
    if (statusCard && status === 'unsafe' && lastStatus !== 'unsafe') {
        statusCard.classList.add('card-alert');
        setTimeout(() => statusCard.classList.remove('card-alert'), 2000);
    }

    lastStatus = status;

    // ── Progress bars ──
    updateProgressBars(ph, turbidity);

    // ── Charts ──
    updateCharts(ph, turbidity, timeLabel);

    // ── Store in history ──
    const point = { ph, turbidity, status, action, time: new Date() };
    dataHistory.push(point);
    if (dataHistory.length > MAX_HISTORY_STORE) dataHistory.shift();

    // ── Quick stats ──
    updateQuickStats();

    // ── History panel ──
    updateHistoryPanel();

    // ── Live clock / last updated ──
    const lastUpdateEl = $('lastUpdate');
    if (lastUpdateEl) animateValue(lastUpdateEl, timeLabel);

    const dataPointsEl = $('dataPoints');
    if (dataPointsEl) animateValue(dataPointsEl, dataHistory.length);
}

// ─── Quick stats ──────────────────────────────────────────────���───────────────
function updateQuickStats() {
    if (dataHistory.length === 0) return;

    const pHs = dataHistory.map(d => d.ph);
    const turbs = dataHistory.map(d => d.turbidity);

    const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;

    animateValue($('avgPh'), avg(pHs).toFixed(2));
    animateValue($('minPh'), Math.min(...pHs).toFixed(2));
    animateValue($('maxPh'), Math.max(...pHs).toFixed(2));

    animateValue($('avgTurbidity'), avg(turbs).toFixed(2));
    animateValue($('minTurbidity'), Math.min(...turbs).toFixed(2));
    animateValue($('maxTurbidity'), Math.max(...turbs).toFixed(2));
}

// ─── History panel ────────────────────────────────────────────────────────────
function updateHistoryPanel() {
    const tbody = $('historyBody');
    if (!tbody) return;

    const recent = dataHistory.slice(-MAX_HISTORY_ROWS).reverse();
    tbody.innerHTML = recent.map(d => {
        const cls = statusBadgeClass(d.status);
        return `<tr class="history-row fade-in">
            <td>${d.time.toLocaleTimeString()}</td>
            <td>${d.ph.toFixed(2)}</td>
            <td>${d.turbidity.toFixed(2)}</td>
            <td><span class="badge badge-${cls}">${d.status}</span></td>
            <td>${d.action}</td>
        </tr>`;
    }).join('');
}

// ─── Loading state ────────────────────────────────────────────────────────────
function setLoading(loading) {
    const spinner = $('loadingSpinner');
    if (spinner) spinner.style.display = loading ? 'flex' : 'none';
    const refreshBtn = $('refreshBtn');
    if (refreshBtn) refreshBtn.disabled = loading;
}

// ─── Online / offline status ──────────────────────────────────────────────────
function setOnlineStatus(online) {
    isOnline = online;
    const indicator = $('connectionStatus');
    if (!indicator) return;
    if (online) {
        indicator.className = 'connection-badge online';
        indicator.textContent = '● Connected';
        retryCount = 0;
    } else {
        indicator.className = 'connection-badge offline';
        indicator.textContent = '● Offline';
    }
}

// ─── Error messages ───────────────────────────────────────────────────────────
function showError(msg) {
    const el = $('errorMessage');
    if (!el) return;
    el.innerHTML = '❌ ' + msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function clearError() {
    const el = $('errorMessage');
    if (el) el.style.display = 'none';
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function fetchData() {
    setLoading(true);
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) {
            if (res.status === 404) {
                showError('No sensor data available yet. Waiting for IoT input…');
            } else {
                throw new Error('HTTP ' + res.status);
            }
            setLoading(false);
            return;
        }

        const data = await res.json();

        // Map backend fields: ph, turbidity, status, action
        updateDashboard(data);
        clearError();
        setOnlineStatus(true);
        retryCount = 0;
    } catch (err) {
        retryCount++;
        const ts = new Date().toLocaleTimeString();
        console.error(`[${ts}] Fetch error (attempt ${retryCount}):`, err);

        if (retryCount <= MAX_RETRIES) {
            showError(`Connection error. Retrying… (${retryCount}/${MAX_RETRIES})`);
        } else {
            showError('API unavailable. Dashboard will keep retrying in the background.');
            setOnlineStatus(false);
        }
    } finally {
        setLoading(false);
    }
}

// ─── Action buttons ───────────────────────────────────────────────────────────
function manualRefresh() {
    fetchData();
}

function clearHistory() {
    dataHistory = [];
    lastStatus = null;

    // Clear charts
    [phChart, turbidityChart].forEach(chart => {
        if (!chart) return;
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
    });

    // Clear history table
    const tbody = $('historyBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;">No data yet</td></tr>';

    // Reset stats
    ['avgPh','minPh','maxPh','avgTurbidity','minTurbidity','maxTurbidity','dataPoints'].forEach(id => {
        const el = $(id);
        if (el) el.textContent = '--';
    });

    // Reset progress bars
    ['phProgressBar','turbProgressBar'].forEach(id => {
        const el = $(id);
        if (el) { el.style.width = '0%'; }
    });

    $('dataPoints') && ($('dataPoints').textContent = '0');
}

function exportCSV() {
    if (dataHistory.length === 0) {
        showError('No data to export yet.');
        return;
    }
    const header = 'Timestamp,pH,Turbidity (NTU),Status,Action\n';
    const rows = dataHistory.map(d =>
        `"${d.time.toLocaleString()}",${d.ph.toFixed(2)},${d.turbidity.toFixed(2)},${d.status},${d.action}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-quality-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Dark mode ────────────────────────────────────────────────────────────────
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    const btn = $('darkModeBtn');
    if (btn) btn.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// ─── Live clock ───────────────────────────────────────────────────────────────
function startLiveClock() {
    const clock = $('liveClock');
    if (!clock) return;
    const tick = () => { clock.textContent = new Date().toLocaleTimeString(); };
    tick();
    setInterval(tick, 1000);
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar navigation
    initSidebarNavigation();

    // Wire up buttons
    const refreshBtn = $('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', manualRefresh);

    const clearBtn = $('clearHistoryBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    const exportBtn = $('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    const darkBtn = $('darkModeBtn');
    if (darkBtn) darkBtn.addEventListener('click', toggleDarkMode);

    // Init charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initCharts();
    }

    // Start live clock
    startLiveClock();

    // Initial fetch + polling every 3 seconds
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
});
