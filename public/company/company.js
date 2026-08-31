const urlParams = new URLSearchParams(window.location.search), companyId = urlParams.get('id');

function switchCompanyTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tab));
  if (btn) btn.classList.add('active');
  const pane = document.getElementById(`pane-${tab}`);
  if (pane) pane.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  if (!companyId) return showAlert('No company ID specified.', 'danger');
  loadCompanyDetails(); loadShareholders(); setupWorkShift();
});

async function loadCompanyDetails() {
  const token = getAuthToken();
  try {
    const [res, userMap] = await Promise.all([
      fetch(`${BACKEND}/company?id=${companyId}`, { headers: token ? { 'Auth': token } : {} }),
      getUserMap()
    ]);
    const data = await res.json(), c = data.company || data;
    if (!c.name) return;

    document.getElementById('companyNameHeader').textContent = c.name;
    const typeNames = { 0: 'Production Company', 1: 'Holding Company', 2: 'WebStore' };
    document.getElementById('companyTypeSubtitle').textContent = `${typeNames[c.type] || 'Enterprise'} (ID #${c.id})`;
    document.getElementById('compCash').textContent = formatCash(c.cash);
    document.getElementById('compShares').textContent = Number(c.shares_outstanding || 0).toLocaleString();

    const ceoId = (c.ceo !== undefined && c.ceo !== null) ? Number(c.ceo) : null;
    const founderId = ((c.founder_id ?? c.founder) !== undefined && (c.founder_id ?? c.founder) !== null) ? Number(c.founder_id ?? c.founder) : null;
    
    document.getElementById('compCeo').innerHTML = ceoId !== null ? `<a href="/portfolio/?user=${ceoId}" style="color: var(--primary); font-weight: 600;">${escapeHtml(userMap[ceoId] || `Citizen #${ceoId}`)}</a>` : '<span style="color: var(--text-muted);">None</span>';
    document.getElementById('compFounder').innerHTML = founderId !== null ? `<a href="/portfolio/?user=${founderId}" style="color: var(--primary); font-weight: 600;">${escapeHtml(userMap[founderId] || `Citizen #${founderId}`)}</a>` : '<span style="color: var(--text-muted);">None</span>';

    renderFacilities(c); renderInventory(c);

    const isCeo = (c.data !== undefined && c.data !== null) || (localStorage.getItem('oe_user_id') !== null && Number(localStorage.getItem('oe_user_id')) === ceoId);
    if (isCeo) {
      document.getElementById('tabBtnCeo').style.display = 'block';
      if (typeof renderCEODashboard === 'function') renderCEODashboard(document.getElementById('ceoManagementCard'), companyId, token);
    }
  } catch (err) { showAlert(err.message || 'Failed to load profile', 'danger'); }
}

function renderFacilities(c) {
  const facs = (c.data && Array.isArray(c.data.facilities)) ? c.data.facilities : (Array.isArray(c.facilities) ? c.facilities : []);
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;
  if (!facs.length) return tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No facilities owned yet.</td></tr>';
  const rNames = { 0: 'Food', 1: 'Water', 2: 'Grain', 3: 'Electricity', 4: 'Cement', 5: 'Metal', 6: 'RawOre' };
  tbody.innerHTML = facs.map(f => {
    const rec = f.recipe || {}, inStr = Object.entries(rec.inputs || {}).map(([r, a]) => `${a} ${rNames[r] || `R#${r}`}`).join(', ') || 'None', outStr = `${rec.amount || 0} ${rNames[rec.output] || `R#${rec.output ?? '-'}`}`;
    return `<tr><td><strong>${escapeHtml(f.name || 'Facility')}</strong><br><small style="color: var(--text-muted);">${f.id || ''}</small></td><td>${escapeHtml(rec.name || 'Standard')}</td><td><span style="color: var(--text-muted);">${inStr}</span> &rarr; <strong style="color: var(--success);">${outStr}</strong></td><td><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">${f.active ? 'Active' : 'Inactive'} (${f.efficiency || 1}x)</span></td></tr>`;
  }).join('');
}

function renderInventory(c) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  const inv = (c.data && c.data.inventory) ? c.data.inventory : (c.inventory || {});
  const resList = typeof RESOURCES !== 'undefined' ? RESOURCES : [{ id: 0, name: 'Food' }, { id: 1, name: 'Water' }, { id: 2, name: 'Grain' }, { id: 3, name: 'Electricity' }, { id: 4, name: 'Cement' }, { id: 5, name: 'Metal' }, { id: 6, name: 'RawOre' }];
  tbody.innerHTML = resList.map(r => `<tr><td><code>#${r.id}</code></td><td><strong>${escapeHtml(r.name)}</strong></td><td><strong style="color: ${Number(inv[r.id] ?? inv[String(r.id)] ?? 0) > 0 ? 'var(--success)' : 'var(--text-muted)'};">${Number(inv[r.id] ?? inv[String(r.id)] ?? 0).toLocaleString()}</strong></td><td><a href="/market/?resource=${r.id}" class="btn btn-secondary btn-sm">Trade on Market &rarr;</a></td></tr>`).join('');
}

async function loadShareholders() {
  const tbody = document.getElementById('shareholdersTableBody');
  try {
    const [res, userMap, compMap] = await Promise.all([fetch(`${BACKEND}/company/shareholders?id=${companyId}`), getUserMap(), getCompanyMap()]);
    const data = await res.json(), list = data.shareholders || [];
    if (!list.length) return tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No recorded shareholders</td></tr>';
    tbody.innerHTML = list.map(s => `<tr><td>#${s.share_id}</td><td>${s.owner_user ? `<a href="/portfolio/?user=${s.owner_id}" style="color: var(--primary); font-weight: 600;">${escapeHtml(userMap[s.owner_id] || `Citizen #${s.owner_id}`)}</a>` : `<a href="/company/?id=${s.owner_id}" style="color: var(--accent); font-weight: 600;">${escapeHtml(compMap[s.owner_id] || `Company #${s.owner_id}`)}</a>`}</td><td>${s.owner_user ? 'Citizen' : 'Company'}</td><td>${Number(s.quantity).toLocaleString()}</td><td><strong>${s.percentage}%</strong></td></tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

function setupWorkShift() {
  document.getElementById('btnWorkShift').addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return showAlert('Please login to work a shift.', 'danger');
    try {
      const res = await fetch(`${BACKEND}/company/work`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(companyId) }) });
      const data = await res.json();
      if (data.wage_paid !== undefined || data.status === 'Success') {
        const prod = data.production ? ` (${data.production.facility}: +${data.production.quantity})` : '';
        showAlert(`Shift complete! Paid wage: $${data.wage_paid || 0}${prod}`, 'success');
        loadCompanyDetails(); if (typeof renderAuthNav === 'function') renderAuthNav();
      } else showAlert(data.message || data.status || 'Work shift failed', 'danger');
    } catch (e) { showAlert(e.message, 'danger'); }
  });
}
