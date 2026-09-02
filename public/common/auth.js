function getAuthToken() { return localStorage.getItem('oe_token'); }
function getAuthUser() { return localStorage.getItem('oe_username'); }

async function renderAuthNav() {
  const token = getAuthToken(), user = getAuthUser(), navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (token) {
    navAuth.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">👤 ${escapeHtml(user || 'Citizen')}</span>
      <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      localStorage.clear(); window.location.reload();
    });

    let uid = localStorage.getItem('oe_user_id');
    if (uid === null) {
      try {
        const res = await fetch(`${BACKEND}/portfolio`, { headers: { 'Auth': token } }), data = await res.json();
        if (data.user?.id !== undefined) { uid = String(data.user.id); localStorage.setItem('oe_user_id', uid); }
      } catch (e) {}
    }
    const adminLink = document.getElementById('navAdminLink');
    if (adminLink && uid !== null && Number(uid) === 0) adminLink.style.display = 'block';
  }
}
