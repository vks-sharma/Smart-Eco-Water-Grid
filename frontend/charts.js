// Chart management
let turbidityChart = null;
let phChart        = null;
let modalChart     = null;

const PARAM_LABELS = {
  ph:              'pH',
  turbidity:       'Turbidity (NTU)',
  temperature:     'Temperature (°C)',
  dissolvedOxygen: 'Dissolved Oxygen (mg/L)',
  conductivity:    'Conductivity (µS/cm)',
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
  turbidityChart = createParamChart('turbidityChart', 'Turbidity (NTU)', '#ef4444');
  phChart        = createParamChart('phChart',        'pH',              '#3b82f6');
}

function updateDashboardCharts(data) {
  const time = new Date().toLocaleTimeString();

  function pushPoint(chart, value) {
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }

  if (turbidityChart) pushPoint(turbidityChart, data.turbidity);
  if (phChart)        pushPoint(phChart, data.ph);
}

async function openParamModal(param) {
  const label = PARAM_LABELS[param] || param;
  const modal  = document.getElementById('chartModal');
  const title  = document.getElementById('chartModalTitle');
  title.textContent = label + ' — Live History';

  // Destroy previous modal chart
  if (modalChart) { modalChart.destroy(); modalChart = null; }

  // Fetch history
  let history = [];
  try {
    const res = await fetch('/history?limit=50');
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
