const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  if (!companyId) {
    showAlert('No company ID specified in URL query parameter.', 'danger');
    return;
  }
  loadCompanyDetails();
  loadShareholders();
  setupWorkShift();
});

async function loadCompanyDetails() {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Auth'] = token;

  try {
    const res = await fetch(`${BACKEND}/company?id=${companyId}`, { headers });
    const data = await res.json();
    const c = data.company || data;

    if (c.name) {
      document.getElementById('companyNameHeader').textContent = c.name;
      const typeNames = { 0: 'Production Company', 1: 'Holding Company', 2: 'WebStore' };
      document.getElementById('companyTypeSubtitle').textContent = `${typeNames[c.type] || 'Enterprise'} (ID #${c.id})`;
      document.getElementById('compCash').textContent = formatCash(c.cash);
      document.getElementById('compShares').textContent = Number(c.shares_outstanding || 0).toLocaleString();
      document.getElementById('compCeo').textContent = c.ceo ? `Citizen #${c.ceo}` : 'None';
      document.getElementById('compFounder').textContent = c.founder_id ? `Citizen #${c.founder_id}` : 'None';

      const ceoCard = document.getElementById('ceoManagementCard');
      if (c.data && ceoCard && typeof renderCEODashboard === 'function') {
        renderCEODashboard(ceoCard, companyId, token);
      }
    }
  } catch (err) {
    showAlert(err.message || 'Failed to load company profile', 'danger');
  }
}

async function loadShareholders() {
  const tbody = document.getElementById('shareholdersTableBody');
  try {
    const res = await fetch(`${BACKEND}/company/shareholders?id=${companyId}`);
    const data = await res.json();
    const list = data.shareholders || [];

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No recorded shareholders</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(s => `
      <tr>
        <td>#${s.share_id}</td>
        <td>${s.owner_user ? `Citizen #${s.owner_id}` : `Company #${s.owner_id}`}</td>
        <td>${s.owner_user ? 'Individual' : 'Corporate'}</td>
        <td>${Number(s.quantity).toLocaleString()}</td>
        <td><strong>${s.percentage}%</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function setupWorkShift() {
  document.getElementById('btnWorkShift').addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return showAlert('Please login to work a shift.', 'danger');
    try {
      const res = await fetch(`${BACKEND}/company/work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Auth': token },
        body: JSON.stringify({ company_id: Number(companyId) })
      });
      const data = await res.json();
      if (data.wage_paid !== undefined) {
        showAlert(`Shift complete! Paid wage: $${data.wage_paid}`, 'success');
        loadCompanyDetails();
      } else {
        showAlert(data.message || data.status || 'Work shift failed', 'danger');
      }
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  });
}
