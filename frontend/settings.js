// Settings page — threshold editor

let settingsFormBuilt = false;

const PARAM_DISPLAY = {
  ph:              { label: 'pH', unit: '' },
  turbidity:       { label: 'Turbidity', unit: 'NTU' },
  temperature:     { label: 'Temperature', unit: '°C' },
  dissolvedOxygen: { label: 'Dissolved Oxygen', unit: 'mg/L' },
  conductivity:    { label: 'Conductivity', unit: 'µS/cm' },
};

async function loadSettings() {
  try {
    const res = await fetch('/settings/thresholds');
    if (!res.ok) return;
    const data = await res.json();
    AppState.thresholds = data;
    buildSettingsForm(data);
  } catch { /* ignore */ }
}

function buildSettingsForm(thresholds) {
  const container = document.getElementById('thresholdForm');
  if (!container) return;
  container.innerHTML = '';
  settingsFormBuilt = true;

  for (const [param, meta] of Object.entries(PARAM_DISPLAY)) {
    const th = thresholds[param] || {};
    const safe = th.safe || {};
    const group = document.createElement('div');
    group.className = 'threshold-group';
    group.innerHTML = `
      <h4>${meta.label}${meta.unit ? ' (' + meta.unit + ')' : ''}</h4>
      <div class="threshold-row">
        <label>Safe min</label>
        <input type="number" step="0.01" data-param="${param}" data-field="safe_min"
               value="${safe.min ?? ''}" placeholder="—">
        <label>Safe max</label>
        <input type="number" step="0.01" data-param="${param}" data-field="safe_max"
               value="${safe.max ?? ''}" placeholder="—">
      </div>`;
    container.appendChild(group);
  }

  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) {
    saveBtn.disabled = !AppState.isAdmin();
    saveBtn.title    = AppState.isAdmin() ? '' : 'Login as admin to save settings';
  }

  const guestNote = document.getElementById('settingsGuestNote');
  if (guestNote) {
    guestNote.style.display = AppState.isAdmin() ? 'none' : 'block';
  }
}

async function saveSettings() {
  if (!AppState.isAdmin()) return;
  const inputs = document.querySelectorAll('#thresholdForm input[data-param]');
  const updates = {};

  inputs.forEach(input => {
    const param = input.dataset.param;
    const field = input.dataset.field;
    const val   = input.value !== '' ? parseFloat(input.value) : undefined;
    if (!updates[param]) updates[param] = { safe: {}, moderate: {}, unsafe: {} };
    if (field === 'safe_min') updates[param].safe.min = val;
    if (field === 'safe_max') updates[param].safe.max = val;
  });

  // Remove undefined keys
  for (const p of Object.keys(updates)) {
    for (const range of ['safe', 'moderate', 'unsafe']) {
      for (const k of Object.keys(updates[p][range])) {
        if (updates[p][range][k] === undefined) delete updates[p][range][k];
      }
    }
  }

  try {
    const res = await fetch('/settings/thresholds', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AppState.getToken()
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) { alert('Error: ' + (data.error || 'Save failed.')); return; }
    AppState.thresholds = data;
    alert('Thresholds saved successfully.');
  } catch {
    alert('Network error saving settings.');
  }
}
