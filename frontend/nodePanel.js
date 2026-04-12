// Per-node slide-in panel (opened when a deployment map node is clicked)
let nodePanelChart = null;

async function openNodePanel(nodeId) {
  const panel = document.getElementById('nodePanel');
  panel.style.display = 'flex';

  document.getElementById('nodePanelTitle').textContent = 'Loading…';
  document.getElementById('nodePanelBody').innerHTML    = '<p>Loading node data…</p>';

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
      </div>` : '<p>No sensor readings for this node yet.</p>';

    document.getElementById('nodePanelBody').innerHTML = `
      <p><b>Type:</b> ${node.type} &nbsp;|&nbsp; <b>Flow:</b> ${node.flow ? node.flow.toFixed(2) : '--'} &nbsp;|&nbsp; <b>Quality:</b> ${node.quality ? node.quality.toFixed(2) : '--'}</p>
      ${statsHtml}
      <canvas id="nodePanelChart" height="160"></canvas>`;

    if (history.length > 0) {
      const ctx    = document.getElementById('nodePanelChart').getContext('2d');
      const labels = history.map(r => new Date(r.timestamp).toLocaleTimeString());
      nodePanelChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'pH',        data: history.map(r => r.ph),        borderColor: '#3b82f6', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
            { label: 'Turbidity', data: history.map(r => r.turbidity), borderColor: '#ef4444', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
          ]
        },
        options: { animation: false, responsive: true, scales: { y: { beginAtZero: false } } }
      });
    }

  } catch (err) {
    document.getElementById('nodePanelBody').innerHTML = '<p>Error loading node data.</p>';
    console.error('nodePanel error:', err);
  }
}

function makeStatRow(label, value, param) {
  const display = value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--';
  const cls     = param ? AppState.classifyParam(param, value) : '';
  return `<div class="stat-row"><span>${label}</span><span class="stat-val ${cls}">${display}</span></div>`;
}

function closeNodePanel() {
  document.getElementById('nodePanel').style.display = 'none';
  if (nodePanelChart) { nodePanelChart.destroy(); nodePanelChart = null; }
}
