// AppState — single source of truth for the frontend
const AppState = {
  user:            null,          // { username, role } or null for guest
  thresholds:      null,          // loaded from /settings/thresholds
  latestData:      null,          // last sensor reading
  darkMode:        false,
  refreshInterval: 300000,        // 5 minutes in ms

  init() {
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    if (this.darkMode) document.documentElement.classList.add('dark-mode');

    const stored = sessionStorage.getItem('authToken');
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          this.user = { username: payload.username, role: payload.role, token: stored };
        } else {
          sessionStorage.removeItem('authToken');
        }
      } catch { sessionStorage.removeItem('authToken'); }
    }
  },

  setDarkMode(on) {
    this.darkMode = on;
    localStorage.setItem('darkMode', on);
    document.documentElement.classList.toggle('dark-mode', on);
    document.body.classList.toggle('dark-mode', on);
  },

  login(username, role, token) {
    this.user = { username, role, token };
    sessionStorage.setItem('authToken', token);
  },

  logout() {
    this.user = null;
    sessionStorage.removeItem('authToken');
  },

  getToken() {
    return this.user ? this.user.token : null;
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  classifyParam(param, value) {
    if (value == null || !this.thresholds) return 'unknown';
    const th = this.thresholds[param];
    if (!th) return 'unknown';
    const { safe, moderate, unsafe } = th;
    if (unsafe) {
      if (unsafe.min != null && value >= unsafe.min) return 'unsafe';
      if (unsafe.max != null && value <= unsafe.max) return 'unsafe';
    }
    const safeMin = safe && safe.min != null ? safe.min : -Infinity;
    const safeMax = safe && safe.max != null ? safe.max : Infinity;
    if (value >= safeMin && value <= safeMax) return 'safe';
    return 'moderate';
  }
};
