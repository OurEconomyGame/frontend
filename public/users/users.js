document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadUsers();
  document.getElementById('sortUsers').addEventListener('change', loadUsers);
});

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
        <td><a href="/portfolio/?user=${u.id}" style="color: var(--primary); font-weight: 600;">${escapeHtml(u.username)}</a></td>
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
