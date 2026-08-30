const BACKEND = 'https://oureconomy.server.napp9.com:443';

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
  setupCEODashboard();
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

async function loadCompanyDetails() {
  const token = localStorage.getItem('oe_token');
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
      document.getElementById('compCash').textContent = `$${Number(c.cash || 0).toLocaleString()}`;
      document.getElementById('compShares').textContent = Number(c.shares_outstanding || 0).toLocaleString();
      document.getElementById('compCeo').textContent = c.ceo ? `Citizen #${c.ceo}` : 'None';
      document.getElementById('compFounder').textContent = c.founder_id ? `Citizen #${c.founder_id}` : 'None';

      if (c.data) {
        // Logged in as CEO
        const ceoCard = document.getElementById('ceoManagementCard');
        if (ceoCard) ceoCard.style.display = 'block';
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

function setupCEODashboard() {
  const token = localStorage.getItem('oe_token');

  // Work Shift
  document.getElementById('btnWorkShift').addEventListener('click', async () => {
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

  // Buy Facility
  const formFacility = document.getElementById('formFacility');
  if (formFacility) {
    formFacility.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recipe = document.getElementById('facilityRecipe').value.trim();
      const name = document.getElementById('facilityName').value.trim();
      try {
        const body = { company_id: Number(companyId), recipe };
        if (name) body.name = name;
        const res = await fetch(`${BACKEND}/facility/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Auth': token },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.facility_id) {
          showAlert(`Purchased facility #${data.facility_id} for $${data.cost}!`, 'success');
          loadCompanyDetails();
        } else {
          showAlert(data.message || 'Facility purchase failed', 'danger');
        }
      } catch (err) {
        showAlert(err.message, 'danger');
      }
    });
  }

  // Set Wage
  const formWage = document.getElementById('formWage');
  if (formWage) {
    formWage.addEventListener('submit', async (e) => {
      e.preventDefault();
      const wage = document.getElementById('inputWage').value;
      try {
        const res = await fetch(`${BACKEND}/company/wage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Auth': token },
          body: JSON.stringify({ company_id: Number(companyId), wage: Number(wage) })
        });
        const data = await res.json();
        if (data.status === 'success' || data.wage !== undefined) {
          showAlert(`Shift wage updated to $${data.wage}!`, 'success');
        } else {
          showAlert(data.message || 'Wage update failed', 'danger');
        }
      } catch (err) {
        showAlert(err.message, 'danger');
      }
    });
  }

  // Pay Dividend
  const formDividend = document.getElementById('formDividend');
  if (formDividend) {
    formDividend.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = document.getElementById('inputDividend').value;
      try {
        const res = await fetch(`${BACKEND}/company/dividend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Auth': token },
          body: JSON.stringify({ company_id: Number(companyId), amount: Number(amount) })
        });
        const data = await res.json();
        if (data.dividend_distributed !== undefined) {
          showAlert(`Distributed $${data.dividend_distributed} to ${data.shareholders_paid} shareholders!`, 'success');
          loadCompanyDetails();
          loadShareholders();
        } else {
          showAlert(data.message || 'Dividend distribution failed', 'danger');
        }
      } catch (err) {
        showAlert(err.message, 'danger');
      }
    });
  }
}
