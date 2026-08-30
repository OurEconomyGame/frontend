const BACKEND = 'https://oureconomy.server.napp9.com:443';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadCompanies();

  document.getElementById('sortSelect').addEventListener('change', loadCompanies);
  document.getElementById('typeSelect').addEventListener('change', loadCompanies);
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

async function loadCompanies() {
  const tbody = document.getElementById('companiesTableBody');
  const sortBy = document.getElementById('sortSelect').value;
  const type = document.getElementById('typeSelect').value;
  const token = localStorage.getItem('oe_token');

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading companies...</td></tr>';

  let url = `${BACKEND}/list/companies?sortBy=${sortBy}`;
  if (type !== '') url += `&type=${type}`;

  const headers = {};
  if (token) headers['Auth'] = token;

  try {
    const res = await fetch(url, { headers });
    const companies = await res.json();

    if (!Array.isArray(companies) || companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No companies found</td></tr>';
      return;
    }

    const typeLabels = { 0: 'Production', 1: 'Holding', 2: 'WebStore' };
    const badgeClasses = { 0: 'badge-production', 1: 'badge-holding', 2: 'badge-store' };

    tbody.innerHTML = companies.map(c => `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td>${escapeHtml(c.name)}</td>
        <td><span class="badge ${badgeClasses[c.type] || ''}">${typeLabels[c.type] || 'Unknown'}</span></td>
        <td>$${Number(c.cash || 0).toLocaleString()}</td>
        <td>${c.shares_outstanding || 0}</td>
        <td>${c.ceo ? `Citizen #${c.ceo}` : 'None'}</td>
        <td>
          <a href="/company/?id=${c.id}" class="btn btn-secondary btn-sm">Details</a>
          <button class="btn btn-primary btn-sm" onclick="workShift(${c.id})">Work Shift</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

window.workShift = async function(companyId) {
  const token = localStorage.getItem('oe_token');
  const alertBox = document.getElementById('alertBox');
  alertBox.className = 'alert';

  if (!token) {
    alertBox.className = 'alert alert-danger visible';
    alertBox.textContent = 'You must be logged in to work a shift.';
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/company/work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': token
      },
      body: JSON.stringify({ company_id: companyId })
    });
    const data = await res.json();

    if (data.status === 'success' || data.wage_paid !== undefined) {
      alertBox.className = 'alert alert-success visible';
      alertBox.textContent = `Shift completed! Earned wage: $${data.wage_paid || 0}. Remaining company cash: $${data.company_cash || 0}`;
      loadCompanies();
    } else {
      alertBox.className = 'alert alert-danger visible';
      alertBox.textContent = data.message || data.status || 'Work shift failed';
    }
  } catch (err) {
    alertBox.className = 'alert alert-danger visible';
    alertBox.textContent = err.message || 'Error working shift';
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
