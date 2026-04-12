// Chart management
let turbidityChart = null;
let phChart        = null;
let tempChart      = null;
let doChart        = null;
let modalChart     = null;

const PARAM_LABELS = {
  ph:              'pH',
  turbidity:       'Turbidity (NTU)',
  temperature:     'Temperature (°C)',
  dissolvedOxygen: 'Dissolved Oxygen (mg/L)',
  conductivity:    'Conductivity (µS/cm)',
  tds:             'TDS (mg/L)',
};

function createParamChart(canvasId, label, color) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor:     color || '#1a4d8f',
        backgroundColor: (color || '#1a4d8f') + '22',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      animation: false,
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: false }
      }
    }
  });
}

function initDashboardCharts() {
  if (turbidityChart) { turbidityChart.destroy(); turbidityChart = null; }
  if (phChart)        { phChart.destroy();        phChart = null; }
  if (tempChart)      { tempChart.destroy();      tempChart = null; }
  if (doChart)        { doChart.destroy();        doChart = null; }
  turbidityChart = createParamChart('turbidityChart', 'Turbidity (NTU)',      '#ef4444');
  phChart        = createParamChart('phChart',        'pH',                   '#3b82f6');
  tempChart      = createParamChart('tempChart',      'Temperature (°C)',     '#f59e0b');
  doChart        = createParamChart('doChart',        'Dissolved O₂ (mg/L)', '#8b5cf6');
}

function updateDashboardCharts(data) {
  const time = new Date().toLocaleTimeString();

  function pushPoint(chart, value) {
    if (!chart) return;
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }

  pushPoint(turbidityChart, data.turbidity);
  pushPoint(phChart,        data.ph);
  pushPoint(tempChart,      data.temperature);
  pushPoint(doChart,        data.dissolvedOxygen);
}

async function openParamModal(param) {
  const label = PARAM_LABELS[param] || param;
  const modal  = document.getElementById('chartModal');
  const title  = document.getElementById('chartModalTitle');
  title.textContent = label + ' — Live History';

  // Destroy previous modal chart
  if (modalChart) { modalChart.destroy(); modalChart = null; }

  // Fetch history (node-aware)
  let history = [];
  try {
    const nodeParam = AppState.selectedNodeId ? '&nodeId=' + AppState.selectedNodeId : '';
    const res = await fetch('/history?limit=50' + nodeParam);
    if (res.ok) history = await res.json();
  } catch {}

  const labels = history.map(r => new Date(r.timestamp).toLocaleTimeString());
  const values = history.map(r => r[param] ?? null);

  const ctx = document.getElementById('modalChartCanvas').getContext('2d');
  modalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#1a4d8f',
        backgroundColor: '#1a4d8f22',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        fill: true,
        spanGaps: true,
      }]
    },
    options: {
      animation: false,
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } }
    }
  });

  modal.showModal();
}

function closeChartModal() {
  document.getElementById('chartModal').close();
  if (modalChart) { modalChart.destroy(); modalChart = null; }
}

