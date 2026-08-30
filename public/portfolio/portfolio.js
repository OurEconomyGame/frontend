document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadPortfolio();
});

async function loadPortfolio() {
  const token = getAuthToken();
  const tbody = document.getElementById('portfolioTableBody');
  const dangerCard = document.getElementById('accountDangerCard');

  if (!token) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view your portfolio.</td></tr>';
    return;
  }

  if (dangerCard) {
    dangerCard.style.display = 'block';
    document.getElementById('btnDeleteUser').addEventListener('click', deleteAccount);
  }

  try {
    const res = await fetch(`${BACKEND}/portfolio`, { headers: { 'Auth': token } });
    const data = await res.json();
    const list = data.portfolio || [];

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">You do not currently own shares in any company.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>#${item.company_id}</strong></td>
        <td>${escapeHtml(item.company_name)}</td>
        <td>${Number(item.quantity).toLocaleString()}</td>
        <td>${Number(item.shares_outstanding).toLocaleString()}</td>
        <td><strong style="color: var(--primary);">${item.ownership_percentage}%</strong></td>
        <td><a href="/company/?id=${item.company_id}" class="btn btn-secondary btn-sm">Company Page</a></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function deleteAccount() {
  const token = getAuthToken();
  if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) return;
  try {
    const res = await fetch(`${BACKEND}/user/delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }
    });
    const data = await res.json();
    if (data.status === 'success' || data.deleted_user_id) {
      localStorage.removeItem('oe_token');
      localStorage.removeItem('oe_username');
      localStorage.removeItem('oe_user_id');
      alert('Your account has been deleted successfully.');
      window.location.href = '/';
    } else showAlert(data.message || 'Account deletion failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
