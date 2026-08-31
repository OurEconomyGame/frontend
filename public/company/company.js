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
    const [res, userMap] = await Promise.all([fetch(`${BACKEND}/company?id=${companyId}`, { headers: token ? { 'Auth': token } : {} }), getUserMap()]);
    const data = await res.json(), c = data.company || data;
    if (!c.name) return;

    document.getElementById('companyNameHeader').textContent = c.name;
    const typeNames = { 0: 'Production Company', 1: 'Holding Company', 2: 'WebStore' };
    document.getElementById('companyTypeSubtitle').textContent = `${typeNames[c.type] || 'Enterprise'} (ID #${c.id})`;
    document.getElementById('compCash').textContent = formatCash(c.cash);
    
    const wageVal = Number(c.wage ?? (c.data && c.data.wage) ?? 10);
    const wageEl = document.getElementById('compWage'), btnWork = document.getElementById('btnWorkShift');
    if (wageEl) wageEl.textContent = `$${wageVal.toLocaleString()}`;
    if (btnWork) btnWork.textContent = `Work Shift ($${wageVal})`;

    document.getElementById('compShares').textContent = Number(c.shares_outstanding || 0).toLocaleString();
    const ceoId = (c.ceo !== undefined && c.ceo !== null) ? Number(c.ceo) : null, founderId = ((c.founder_id ?? c.founder) !== undefined && (c.founder_id ?? c.founder) !== null) ? Number(c.founder_id ?? c.founder) : null;
    document.getElementById('compCeo').innerHTML = await renderUserLink(ceoId);
    document.getElementById('compFounder').innerHTML = await renderUserLink(founderId);

    const isCeo = (c.data !== undefined && c.data !== null) || (localStorage.getItem('oe_user_id') !== null && Number(localStorage.getItem('oe_user_id')) === ceoId);
    const isStore = Number(c.type) === 2;
    const tabFac = document.getElementById('tabBtnFacilities'), tabStore = document.getElementById('tabBtnStore');
    if (tabFac) tabFac.style.display = isStore ? 'none' : 'block';
    if (tabStore) tabStore.style.display = isStore ? 'block' : 'none';

    if (isStore && typeof renderStorefront === 'function') renderStorefront(c, isCeo);
    else if (!isStore && typeof renderFacilities === 'function') renderFacilities(c, isCeo);

    renderInventory(c);
    if (isCeo) {
      document.getElementById('tabBtnCeo').style.display = 'block';
      if (typeof renderCEODashboard === 'function') renderCEODashboard(document.getElementById('ceoManagementCard'), companyId, token, c);
    }
  } catch (err) { showAlert(err.message || 'Failed to load profile', 'danger'); }
}

function renderInventory(c) {
  const tbody = document.getElementById('inventoryTableBody'), warnBox = document.getElementById('inventoryLowWarning');
  if (!tbody) return;
  const inv = (c.data && c.data.inventory) ? c.data.inventory : (c.inventory || {}), resList = typeof RESOURCES !== 'undefined' ? RESOURCES : [{ id: 0, name: 'Food' }, { id: 1, name: 'Water' }, { id: 2, name: 'Grain' }, { id: 3, name: 'Electricity' }, { id: 4, name: 'Cement' }, { id: 5, name: 'Metal' }, { id: 6, name: 'RawOre' }];
  const lowItems = [];
  tbody.innerHTML = resList.map(r => {
    const qty = Number(inv[r.id] ?? inv[String(r.id)] ?? 0);
    const isLow = qty < 100;
    if (isLow) lowItems.push(`${r.name.replace(/Resource #\d+ \((.*)\)/, '$1')} (${qty})`);
    const statusBadge = isLow ? `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">⚠️ Low (&lt;100)</span>` : '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">In Stock</span>';
    return `<tr><td><code>#${r.id}</code></td><td><strong>${escapeHtml(r.name)}</strong></td><td><strong style="color: ${qty > 0 ? (isLow ? '#f87171' : 'var(--success)') : 'var(--text-muted)'};">${qty.toLocaleString()}</strong></td><td>${statusBadge}</td><td><a href="/market/?resource=${r.id}" class="btn btn-secondary btn-sm">Trade &rarr;</a></td></tr>`;
  }).join('');

  if (warnBox) warnBox.innerHTML = lowItems.length ? `<div class="alert alert-danger visible" style="margin-bottom: 16px;">⚠️ <strong>Low Stock Alert (&lt;100):</strong> ${lowItems.join(', ')}</div>` : '';
}

async function loadShareholders() {
  const tbody = document.getElementById('shareholdersTableBody');
  try {
    const [res, compMap] = await Promise.all([fetch(`${BACKEND}/company/shareholders?id=${companyId}`), getCompanyMap()]);
    const data = await res.json(), list = data.shareholders || [];
    if (!list.length) return tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No recorded shareholders</td></tr>';
    const rows = await Promise.all(list.map(async (s) => `<tr><td>#${s.share_id}</td><td>${s.owner_user ? await renderUserLink(s.owner_id) : `<a href="/company/?id=${s.owner_id}" style="color: var(--accent); font-weight: 600;">${escapeHtml(compMap[s.owner_id] || `Company #${s.owner_id}`)}</a>`}</td><td>${s.owner_user ? 'Citizen' : 'Company'}</td><td>${Number(s.quantity).toLocaleString()}</td><td><strong>${s.percentage}%</strong></td></tr>`));
    tbody.innerHTML = rows.join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

function setupWorkShift() {
  document.getElementById('btnWorkShift').addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) return showAlert('Please login to work a shift.', 'danger');
    try {
      const res = await fetch(`${BACKEND}/company/work`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(companyId) }) });
      const data = await res.json();
      if (data.wage_paid !== undefined || data.status === 'Success' || data.status === 'success') {
        const prod = data.production ? ` (${data.production.facility}: +${data.production.quantity})` : '';
        showAlert(`Shift complete! Paid wage: $${data.wage_paid || 0}${prod}`, 'success');
        loadCompanyDetails(); if (typeof renderAuthNav === 'function') renderAuthNav();
      } else {
        const errMsg = data.error || data.message || (data.status && !data.status.toLowerCase().includes('iff') ? data.status : '') || 'Work shift failed';
        showAlert(errMsg, 'danger');
      }
    } catch (e) { showAlert(e.message, 'danger'); }
  });
}
