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

// Chart color configs per parameter
const CHART_COLORS = {
  turbidity:       { line: '#ef4444', glow: 'rgba(239,68,68,0.08)',   gradStart: 'rgba(239,68,68,0.55)',  gradEnd: 'rgba(239,68,68,0.02)' },
  ph:              { line: '#3b82f6', glow: 'rgba(59,130,246,0.08)',  gradStart: 'rgba(59,130,246,0.55)', gradEnd: 'rgba(59,130,246,0.02)' },
  temperature:     { line: '#f59e0b', glow: 'rgba(245,158,11,0.08)',  gradStart: 'rgba(245,158,11,0.55)', gradEnd: 'rgba(245,158,11,0.02)' },
  dissolvedOxygen: { line: '#8b5cf6', glow: 'rgba(139,92,246,0.08)',  gradStart: 'rgba(139,92,246,0.55)', gradEnd: 'rgba(139,92,246,0.02)' },
  conductivity:    { line: '#06b6d4', glow: 'rgba(6,182,212,0.08)',   gradStart: 'rgba(6,182,212,0.55)',  gradEnd: 'rgba(6,182,212,0.02)' },
  tds:             { line: '#10b981', glow: 'rgba(16,185,129,0.08)',  gradStart: 'rgba(16,185,129,0.55)', gradEnd: 'rgba(16,185,129,0.02)' },
};

function getTextColor() {
  return document.documentElement.classList.contains('dark-mode') ? '#94a3b8' : '#475569';
}

function getGridColor() {
  return document.documentElement.classList.contains('dark-mode')
    ? 'rgba(8,145,178,0.12)'
    : 'rgba(226,232,240,0.8)';
}

function createGradient(ctx, colors) {
  const canvas = ctx.canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colors.gradStart);
  gradient.addColorStop(1, colors.gradEnd);
  return gradient;
}

function buildChartOptions(label) {
  const isDark = document.documentElement.classList.contains('dark-mode');
  return {
    animation: { duration: 600, easing: 'easeInOutQuart' },
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: getTextColor(),
          font: { size: 11, family: 'Inter, sans-serif', weight: '500' },
          boxWidth: 12,
          padding: 10,
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(13,25,42,0.92)' : 'rgba(255,255,255,0.96)',
        titleColor: isDark ? '#e2e8f0' : '#0f172a',
        bodyColor:  isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? 'rgba(8,145,178,0.3)' : 'rgba(226,232,240,0.8)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        titleFont: { size: 11, weight: '600', family: 'Inter, sans-serif' },
        bodyFont:  { size: 11, family: 'Inter, sans-serif' },
        displayColors: false,
        callbacks: {
          title: (items) => items[0]?.label || new Date().toLocaleTimeString(),
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 7,
          color: getTextColor(),
          font: { size: 10 },
        },
        grid: {
          color: getGridColor(),
          drawBorder: false,
        },
        border: { dash: [3, 3] }
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: getTextColor(),
          font: { size: 10 },
          maxTicksLimit: 5,
        },
        grid: {
          color: getGridColor(),
          drawBorder: false,
        },
        border: { dash: [3, 3] }
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
        hitRadius: 8,
      },
      line: {
        borderWidth: 2.5,
        tension: 0.4,
      }
    },
    interaction: { intersect: false, mode: 'index' },
  };
}

function createParamChart(canvasId, paramKey, label) {
  if (typeof Chart === 'undefined') return null;
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  const context = ctx.getContext('2d');
  const colors = CHART_COLORS[paramKey] || CHART_COLORS.ph;
  const gradient = createGradient(context, colors);

  return new Chart(context, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: colors.line,
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: colors.line,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      }]
    },
    options: buildChartOptions(label),
  });
}

function initDashboardCharts() {
  if (turbidityChart) { turbidityChart.destroy(); turbidityChart = null; }
  if (phChart)        { phChart.destroy();        phChart = null; }
  if (tempChart)      { tempChart.destroy();      tempChart = null; }
  if (doChart)        { doChart.destroy();        doChart = null; }

  turbidityChart = createParamChart('turbidityChart', 'turbidity',       'Turbidity (NTU)');
  phChart        = createParamChart('phChart',        'ph',              'pH');
  tempChart      = createParamChart('tempChart',      'temperature',     'Temperature (°C)');
  doChart        = createParamChart('doChart',        'dissolvedOxygen', 'Dissolved O₂ (mg/L)');
}

function updateDashboardCharts(data) {
  const time = new Date().toLocaleTimeString();

  function pushPoint(chart, value, paramKey) {
    if (!chart) return;
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    // Refresh gradient (for theme changes)
    const ctx = chart.ctx;
    const colors = CHART_COLORS[paramKey] || CHART_COLORS.ph;
    chart.data.datasets[0].backgroundColor = createGradient(ctx, colors);

    // Update theme colors
    chart.options.plugins.tooltip.backgroundColor = document.documentElement.classList.contains('dark-mode')
      ? 'rgba(13,25,42,0.92)' : 'rgba(255,255,255,0.96)';
    chart.options.scales.x.ticks.color = getTextColor();
    chart.options.scales.y.ticks.color = getTextColor();
    chart.options.scales.x.grid.color  = getGridColor();
    chart.options.scales.y.grid.color  = getGridColor();

    chart.update('active');
  }

  pushPoint(turbidityChart, data.turbidity,       'turbidity');
  pushPoint(phChart,        data.ph,              'ph');
  pushPoint(tempChart,      data.temperature,     'temperature');
  pushPoint(doChart,        data.dissolvedOxygen, 'dissolvedOxygen');
}

async function openParamModal(param) {
  if (typeof Chart === 'undefined') return;
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
  const colors = CHART_COLORS[param] || CHART_COLORS.ph;

  const canvas = document.getElementById('modalChartCanvas');
  const gradCtx = canvas.getContext('2d');
  const gradient = gradCtx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 300);
  gradient.addColorStop(0, colors.gradStart);
  gradient.addColorStop(1, colors.gradEnd);

  modalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: colors.line,
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: colors.line,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        tension: 0.4,
        fill: true,
        spanGaps: true,
      }]
    },
    options: {
      ...buildChartOptions(label),
      animation: { duration: 800, easing: 'easeInOutQuart' },
    }
  });

  modal.showModal();
}

function closeChartModal() {
  document.getElementById('chartModal').close();
  if (modalChart) { modalChart.destroy(); modalChart = null; }
}
