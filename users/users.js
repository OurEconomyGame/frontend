const BACKEND = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadUsers();

  document.getElementById('sortUsers').addEventListener('change', loadUsers);
});

function renderAuthNav() {
  const token = localStorage.getItem('oe_token');
  const user = localStorage.getItem('oe_username');
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
      window.location.reload();
    });
  }
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  const sortBy = document.getElementById('sortUsers').value;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Loading citizens...</td></tr>';

  try {
    const res = await fetch(`${BACKEND}/list/users?sortBy=${sortBy}`);
    const users = await res.json();

    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No citizens found</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>#${u.id}</strong></td>
        <td>${escapeHtml(u.username)}</td>
        <td>${u.joined ? new Date(u.joined * 1000).toLocaleDateString() : '-'}</td>
        <td>
          ${u.active
            ? '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">Active</span>'
            : '<span class="badge" style="background: rgba(107, 114, 128, 0.15); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.3);">Inactive</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
