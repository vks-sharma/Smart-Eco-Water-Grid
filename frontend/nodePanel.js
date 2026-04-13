// Per-node slide-in panel (opened when a deployment map node is clicked)
let nodePanelChart = null;

async function openNodePanel(nodeId) {
  const panel = document.getElementById('nodePanel');
  if (!panel) return;

  // Trigger slide-in
  panel.classList.add('panel-open');

  document.getElementById('nodePanelTitle').textContent = 'Loading…';
  document.getElementById('nodePanelBody').innerHTML    =
    '<div class="skeleton" style="height:16px;margin-bottom:8px"></div>' +
    '<div class="skeleton" style="height:16px;width:70%;margin-bottom:8px"></div>' +
    '<div class="skeleton" style="height:120px;margin-top:12px"></div>';

  if (nodePanelChart) { nodePanelChart.destroy(); nodePanelChart = null; }

  try {
    const [nodeRes, histRes] = await Promise.all([
      fetch('/nodes/' + nodeId),
      fetch('/nodes/' + nodeId + '/history?limit=30')
    ]);
    const node    = nodeRes.ok ? await nodeRes.json()    : null;
    const history = histRes.ok ? await histRes.json()    : [];

    if (!node) {
      document.getElementById('nodePanelTitle').textContent = 'Node ' + nodeId;
      document.getElementById('nodePanelBody').innerHTML    = '<p>No data available.</p>';
      return;
    }

    document.getElementById('nodePanelTitle').textContent = node.name;

    const lr = node.latestReading;
    const statsHtml = lr ? `
      <div class="node-stats">
        ${makeStatRow('pH',         lr.ph,              'ph')}
        ${makeStatRow('Turbidity',  lr.turbidity,       'turbidity')}
        ${makeStatRow('Temp (°C)',  lr.temperature,     'temperature')}
        ${makeStatRow('DO (mg/L)',  lr.dissolvedOxygen, 'dissolvedOxygen')}
        ${makeStatRow('Status',     lr.status,          null)}
      </div>` : '<p style="color:var(--text-3);font-size:0.85rem">No sensor readings for this node yet.</p>';

    document.getElementById('nodePanelBody').innerHTML = `
      <div style="font-size:0.82rem;color:var(--text-2);margin-bottom:10px">
        <span style="background:var(--surface-2);padding:3px 8px;border-radius:6px;border:1px solid var(--border)">${node.type}</span>
        &nbsp;&nbsp;Flow: <b>${node.flow ? (node.flow * 100).toFixed(0) + '%' : '--'}</b>
        &nbsp;|&nbsp; Quality: <b>${node.quality ? (node.quality * 100).toFixed(0) + '%' : '--'}</b>
      </div>
      ${statsHtml}
      <div style="margin-top:14px">
        <div style="font-size:0.75rem;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">pH &amp; Turbidity Trend</div>
        <canvas id="nodePanelChart" height="160"></canvas>
      </div>`;

    if (history.length > 0) {
      const isDark = document.documentElement.classList.contains('dark-mode');
      const ctx    = document.getElementById('nodePanelChart').getContext('2d');
      const labels = history.map(r => new Date(r.timestamp).toLocaleTimeString());
      nodePanelChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'pH',
              data: history.map(r => r.ph),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.12)',
              borderWidth: 2, tension: 0.4, pointRadius: 2, fill: false
            },
            {
              label: 'Turbidity',
              data: history.map(r => r.turbidity),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.12)',
              borderWidth: 2, tension: 0.4, pointRadius: 2, fill: false
            },
          ]
        },
        options: {
          animation: { duration: 500 },
          responsive: true,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: isDark ? '#94a3b8' : '#475569',
                font: { size: 10 },
                boxWidth: 10,
              }
            },
            tooltip: {
              backgroundColor: isDark ? 'rgba(13,25,42,0.92)' : 'rgba(255,255,255,0.96)',
              titleColor: isDark ? '#e2e8f0' : '#0f172a',
              bodyColor:  isDark ? '#94a3b8' : '#475569',
              borderColor: isDark ? 'rgba(8,145,178,0.3)' : '#e2e8f0',
              borderWidth: 1,
              cornerRadius: 8,
            }
          },
          scales: {
            x: { display: false },
            y: {
              beginAtZero: false,
              ticks: { color: isDark ? '#94a3b8' : '#475569', font: { size: 10 }, maxTicksLimit: 4 },
              grid: { color: isDark ? 'rgba(8,145,178,0.12)' : 'rgba(226,232,240,0.8)' }
            }
          }
        }
      });
    }

  } catch (err) {
    document.getElementById('nodePanelBody').innerHTML = '<p style="color:var(--unsafe)">Error loading node data.</p>';
    console.error('nodePanel error:', err);
  }
}

function makeStatRow(label, value, param) {
  const display = value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--';
  const cls     = param ? AppState.classifyParam(param, value) : '';
  return `<div class="stat-row"><span>${label}</span><span class="stat-val ${cls}">${display}</span></div>`;
}

function closeNodePanel() {
  const panel = document.getElementById('nodePanel');
  if (!panel) return;
  panel.classList.remove('panel-open');
  // Destroy chart after transition completes
  setTimeout(() => {
    if (nodePanelChart) { nodePanelChart.destroy(); nodePanelChart = null; }
  }, 420);
}
