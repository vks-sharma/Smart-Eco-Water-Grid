// Auth UI logic
function openLoginModal() {
  document.getElementById('loginModal').showModal();
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginForm').reset();
}

function closeLoginModal() {
  document.getElementById('loginModal').close();
}

// Demo login — sets localStorage flags so state persists after reload
function _demoLogin() {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('user', 'Admin');
  AppState.login('Admin', 'admin', 'demo');
  updateAuthUI();
  closeLoginModal();
}

async function submitLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed.'; return; }

    AppState.login(data.username, data.role, data.token);
    updateAuthUI();
    closeLoginModal();
  } catch {
    errEl.textContent = 'Network error. Please try again.';
  }
}

function doLogout() {
  AppState.logout();
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  updateAuthUI();
}

function updateAuthUI() {
  const userNameEl  = document.getElementById('userName');
  const loginBtn    = document.getElementById('loginBtn');
  const logoutBtn   = document.getElementById('logoutBtn');

  if (AppState.user) {
    userNameEl.textContent = AppState.user.username;
    loginBtn.style.display  = 'none';
    logoutBtn.style.display = 'block';
    document.body.classList.add('logged-in');
  } else {
    userNameEl.textContent  = 'Guest';
    loginBtn.style.display  = 'block';
    logoutBtn.style.display = 'none';
    document.body.classList.remove('logged-in');
  }
}
