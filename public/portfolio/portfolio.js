document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadPortfolio();
});

async function loadPortfolio() {
  const token = getAuthToken();
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
