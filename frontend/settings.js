// Settings page — threshold editor

let settingsFormBuilt = false;

const PARAM_DISPLAY = {
  ph:              { label: 'pH', unit: '' },
  turbidity:       { label: 'Turbidity', unit: 'NTU' },
  temperature:     { label: 'Temperature', unit: '°C' },
  dissolvedOxygen: { label: 'Dissolved Oxygen', unit: 'mg/L' },
  conductivity:    { label: 'Conductivity', unit: 'µS/cm' },
  tds:             { label: 'TDS', unit: 'mg/L' },
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
    const th     = thresholds[param] || {};
    const safe   = th.safe   || {};
    const unsafe = th.unsafe || {};

    const group = document.createElement('div');
    group.className = 'threshold-group';
    group.innerHTML = `
      <h4>${meta.label}${meta.unit ? ' (' + meta.unit + ')' : ''}</h4>
      <div class="threshold-row">
        <label class="range-label safe-label">Safe min</label>
        <input type="number" step="0.01" data-param="${param}" data-field="safe_min"
               value="${safe.min != null ? safe.min : ''}" placeholder="—">
        <label class="range-label safe-label">Safe max</label>
        <input type="number" step="0.01" data-param="${param}" data-field="safe_max"
               value="${safe.max != null ? safe.max : ''}" placeholder="—">
      </div>
      <div class="threshold-row">
        <label class="range-label unsafe-label">Unsafe ≥</label>
        <input type="number" step="0.01" data-param="${param}" data-field="unsafe_min"
               value="${unsafe.min != null ? unsafe.min : ''}" placeholder="—">
        <label class="range-label unsafe-label">Unsafe ≤</label>
        <input type="number" step="0.01" data-param="${param}" data-field="unsafe_max"
               value="${unsafe.max != null ? unsafe.max : ''}" placeholder="—">
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
  const inputs  = document.querySelectorAll('#thresholdForm input[data-param]');
  const updates = {};

  inputs.forEach(input => {
    const param = input.dataset.param;
    const field = input.dataset.field;
    const val   = input.value !== '' ? parseFloat(input.value) : undefined;
    if (!updates[param]) updates[param] = { safe: {}, moderate: {}, unsafe: {} };
    if (field === 'safe_min')   updates[param].safe.min   = val;
    if (field === 'safe_max')   updates[param].safe.max   = val;
    if (field === 'unsafe_min') updates[param].unsafe.min = val;
    if (field === 'unsafe_max') updates[param].unsafe.max = val;
  });

  // Remove undefined keys
  for (const p of Object.keys(updates)) {
    for (const range of ['safe', 'moderate', 'unsafe']) {
      for (const k of Object.keys(updates[p][range])) {
        if (updates[p][range][k] === undefined) delete updates[p][range][k];
      }
    }
  }

  const msgEl = document.getElementById('settingsSaveMsg');
  try {
    const res  = await fetch('/settings/thresholds', {
      method:  'PUT',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + AppState.getToken()
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      if (msgEl) { msgEl.textContent = 'Error: ' + (data.error || 'Save failed.'); msgEl.className = 'settings-msg error'; }
      return;
    }
    AppState.thresholds = data;
    if (msgEl) { msgEl.textContent = '✅ Thresholds saved successfully.'; msgEl.className = 'settings-msg success'; }
    setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 4000);
  } catch {
    if (msgEl) { msgEl.textContent = '❌ Network error saving settings.'; msgEl.className = 'settings-msg error'; }
  }
}

