const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  if (!companyId) return showAlert('No company ID specified.', 'danger');
  loadCompanyDetails();
  loadShareholders();
  setupWorkShift();
});

async function loadCompanyDetails() {
  const token = getAuthToken();
  const headers = token ? { 'Auth': token } : {};

  try {
    const res = await fetch(`${BACKEND}/company?id=${companyId}`, { headers });
    const data = await res.json();
    const c = data.company || data;
    if (!c.name) return;

    document.getElementById('companyNameHeader').textContent = c.name;
    const typeNames = { 0: 'Production Company', 1: 'Holding Company', 2: 'WebStore' };
    document.getElementById('companyTypeSubtitle').textContent = `${typeNames[c.type] || 'Enterprise'} (ID #${c.id})`;
    document.getElementById('compCash').textContent = formatCash(c.cash);
    document.getElementById('compShares').textContent = Number(c.shares_outstanding || 0).toLocaleString();

    const ceoId = (c.ceo !== undefined && c.ceo !== null) ? Number(c.ceo) : null;
    const founderId = ((c.founder_id ?? c.founder) !== undefined && (c.founder_id ?? c.founder) !== null) ? Number(c.founder_id ?? c.founder) : null;
    document.getElementById('compCeo').innerHTML = ceoId !== null ? `<a href="/users/" style="color: var(--primary);">Citizen #${ceoId}</a>` : '<span style="color: var(--text-muted);">None</span>';
    document.getElementById('compFounder').innerHTML = founderId !== null ? `<a href="/users/" style="color: var(--primary);">Citizen #${founderId}</a>` : '<span style="color: var(--text-muted);">None</span>';

    renderFacilities(c);

    const ceoCard = document.getElementById('ceoManagementCard');
    const curUserId = localStorage.getItem('oe_user_id');
    const isCeo = (c.data !== undefined && c.data !== null) || (curUserId !== null && ceoId !== null && Number(curUserId) === ceoId);
    if (isCeo && ceoCard && typeof renderCEODashboard === 'function') renderCEODashboard(ceoCard, companyId, token);
  } catch (err) { showAlert(err.message || 'Failed to load profile', 'danger'); }
}

function renderFacilities(c) {
  const facs = (c.data && Array.isArray(c.data.facilities)) ? c.data.facilities : (Array.isArray(c.facilities) ? c.facilities : []);
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;

  if (!facs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No facilities owned yet.</td></tr>';
    return;
  }
  const rNames = { 0: 'Food', 1: 'Water', 2: 'Grain', 3: 'Electricity', 4: 'Cement', 5: 'Metal', 6: 'RawOre' };
  tbody.innerHTML = facs.map(f => {
    const rec = f.recipe || {};
    const inStr = Object.entries(rec.inputs || {}).map(([r, a]) => `${a} ${rNames[r] || `R#${r}`}`).join(', ') || 'None';
    const outStr = `${rec.amount || 0} ${rNames[rec.output] || `R#${rec.output ?? '-'}`}`;
    return `<tr><td><strong>${escapeHtml(f.name || 'Facility')}</strong><br><small style="color: var(--text-muted);">${f.id || ''}</small></td><td>${escapeHtml(rec.name || 'Standard')}</td><td><span style="color: var(--text-muted);">${inStr}</span> &rarr; <strong style="color: var(--success);">${outStr}</strong></td><td><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">${f.active ? 'Active' : 'Inactive'} (${f.efficiency || 1}x)</span></td></tr>`;
  }).join('');
}

async function loadShareholders() {
  const tbody = document.getElementById('shareholdersTableBody');
  try {
    const res = await fetch(`${BACKEND}/company/shareholders?id=${companyId}`);
    const data = await res.json();
    const list = data.shareholders || [];
    if (!list.length) return tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No recorded shareholders</td></tr>';
    tbody.innerHTML = list.map(s => `<tr><td>#${s.share_id}</td><td>${s.owner_user ? `Citizen #${s.owner_id}` : `Company #${s.owner_id}`}</td><td>${s.owner_user ? 'Individual' : 'Corporate'}</td><td>${Number(s.quantity).toLocaleString()}</td><td><strong>${s.percentage}%</strong></td></tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

function setupWorkShift() {
  document.getElementById('btnWorkShift').addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return showAlert('Please login to work a shift.', 'danger');
    try {
      const res = await fetch(`${BACKEND}/company/work`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(companyId) }) });
      const data = await res.json();
      if (data.wage_paid !== undefined) { showAlert(`Shift complete! Paid wage: $${data.wage_paid}`, 'success'); loadCompanyDetails(); }
      else showAlert(data.message || data.status || 'Work shift failed', 'danger');
    } catch (e) { showAlert(e.message, 'danger'); }
  });
}
