const BACKEND = 'https://oureconomy.server.napp9.com:443';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadPortfolio();
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

function showAlert(msg, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = `alert alert-${type} visible`;
  alertBox.textContent = msg;
}

async function loadPortfolio() {
  const token = localStorage.getItem('oe_token');
  const tbody = document.getElementById('portfolioTableBody');

  if (!token) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view your portfolio.</td></tr>';
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/portfolio`, {
      headers: { 'Auth': token }
    });
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
        <td>
          <a href="/company/?id=${item.company_id}" class="btn btn-secondary btn-sm">Company Page</a>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
