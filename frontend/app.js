// === Settings Panel Logic ===
(function() {
  // Default settings
  const DEFAULTS = {
    PH_MIN: 6.5,
    PH_MAX: 8.5,
    TURB_MAX: 10,
    theme: 'light',
    user: 'Guest',
    role: 'guest',
  };

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('settings') || '{}');
      return Object.assign({}, DEFAULTS, s);
    } catch { return { ...DEFAULTS }; }
  }
  function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
  }
  function applySettingsUI(settings) {
    // Fill fields
    var $ = id => document.getElementById(id);
    if ($('settingPhMin')) $('settingPhMin').value = settings.PH_MIN;
    if ($('settingPhMax')) $('settingPhMax').value = settings.PH_MAX;
    if ($('settingTurbidityMax')) $('settingTurbidityMax').value = settings.TURB_MAX;
    if ($('settingTheme')) $('settingTheme').value = settings.theme;
    if ($('settingsUserName')) $('settingsUserName').textContent = settings.user;
    if ($('settingsUserRole')) $('settingsUserRole').textContent = settings.role;
    // Theme live switch
    document.documentElement.setAttribute('data-theme', settings.theme);
  }
  function disableSettingsUI(disabled) {
    ['settingPhMin', 'settingPhMax', 'settingTurbidityMax', 'settingTheme', 'settingsSaveBtn', 'settingsResetBtn']
      .forEach(id => {
        var $el = document.getElementById(id); if ($el) $el.disabled = !!disabled;
      });
    if (document.getElementById('settingsGuestBanner'))
      document.getElementById('settingsGuestBanner').style.display = disabled ? '' : 'none';
  }

  // Panel guest lockout
  let settings = loadSettings();
  const guestMode = settings.role === 'guest';
  applySettingsUI(settings);
  disableSettingsUI(guestMode);

  // Live events
  if (document.getElementById('settingsForm')) {
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
      e.preventDefault();
      if (guestMode) return;
      settings.PH_MIN = parseFloat(document.getElementById('settingPhMin').value);
      settings.PH_MAX = parseFloat(document.getElementById('settingPhMax').value);
      settings.TURB_MAX = parseFloat(document.getElementById('settingTurbidityMax').value);
      settings.theme = document.getElementById('settingTheme').value;
      saveSettings(settings);
      applySettingsUI(settings);
    });
    document.getElementById('settingsResetBtn').addEventListener('click', function() {
      if (guestMode) return;
      settings = { ...DEFAULTS };
      saveSettings(settings);
      applySettingsUI(settings);
      disableSettingsUI(settings.role === 'guest');
    });
    // Inputs live update (optional, instant persist)
    ['settingPhMin','settingPhMax','settingTurbidityMax','settingTheme'].forEach(id => {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', function() {
          if (!guestMode) {
            settings[id === 'settingTheme' ? 'theme' : (id === 'settingPhMin' ? 'PH_MIN' : id === 'settingPhMax' ? 'PH_MAX' : 'TURB_MAX')] = (id === 'settingTheme') ? this.value : parseFloat(this.value);
            saveSettings(settings);
            applySettingsUI(settings);
          }
        });
      }
    });
  }
})();