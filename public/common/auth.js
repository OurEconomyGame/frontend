function getAuthToken() { return localStorage.getItem('oe_token'); }
function getAuthUser() { return window._currentUsername || localStorage.getItem('oe_username') || 'Citizen'; }

async function getCurrentUser(force = false) {
  const token = getAuthToken();
  if (!token) return null;
  if (!force && window._cachedUser && window._cachedUser.token === token) return window._cachedUser;

  try {
    const res = await fetch(`${BACKEND}/user/work`, { headers: { 'Auth': token } });
    const data = await res.json();
    if (data.status === 'Success' && data.user_id !== undefined) {
      window._cachedUser = { id: data.user_id, username: data.username, token };
      localStorage.setItem('oe_user_id', String(data.user_id));
      if (data.username) localStorage.setItem('oe_username', data.username);
      return window._cachedUser;
    }
  } catch (e) {}
  return null;
}

async function renderAuthNav() {
  const token = getAuthToken(), navAuth = document.getElementById('navAuth'), adminLink = document.getElementById('navAdminLink');
  if (!token) {
    if (adminLink) adminLink.style.display = 'none';
    return;
  }

  const user = await getCurrentUser();
  if (navAuth) {
    navAuth.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">👤 ${escapeHtml(user?.username || getAuthUser())}</span>
      <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
    `;
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      localStorage.clear(); window._cachedUser = null; window.location.reload();
    });
  }
  if (adminLink) adminLink.style.display = (user && user.id === 0) ? 'block' : 'none';
}
