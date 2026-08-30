function getAuthToken() {
  return localStorage.getItem('oe_token');
}

function getAuthUser() {
  return localStorage.getItem('oe_username');
}

function renderAuthNav() {
  const token = getAuthToken();
  const user = getAuthUser();
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (token) {
    navAuth.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">👤 ${user || 'Citizen'}</span>
      <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      localStorage.removeItem('oe_token');
      localStorage.removeItem('oe_username');
      localStorage.removeItem('oe_user_id');
      window.location.reload();
    });
  }
}
