document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadPortfolio();
  setupAdminControls();
});

async function loadPortfolio() {
  const token = getAuthToken(), tbody = document.getElementById('portfolioTableBody'), invTbody = document.getElementById('userInventoryTableBody'), dangerCard = document.getElementById('accountDangerCard');

  if (!token) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view your portfolio.</td></tr>';
    if (invTbody) invTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view your inventory.</td></tr>';
    return;
  }
  if (dangerCard) {
    dangerCard.style.display = 'block';
    document.getElementById('btnDeleteUser').addEventListener('click', deleteAccount);
  }

  try {
    const res = await fetch(`${BACKEND}/portfolio`, { headers: { 'Auth': token } });
    const data = await res.json(), list = data.portfolio || [];

    if (tbody) {
      tbody.innerHTML = !list.length ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">You do not currently own shares in any company.</td></tr>' : list.map(item => `<tr><td><strong>#${item.company_id}</strong></td><td>${escapeHtml(item.company_name)}</td><td>${Number(item.quantity).toLocaleString()}</td><td>${Number(item.shares_outstanding).toLocaleString()}</td><td><strong style="color: var(--primary);">${item.ownership_percentage}%</strong></td><td><a href="/company/?id=${item.company_id}" class="btn btn-secondary btn-sm">Company Page</a></td></tr>`).join('');
    }

    if (invTbody) {
      const userInv = (data.user && data.user.inventory) || data.inventory || {};
      const resList = typeof RESOURCES !== 'undefined' ? RESOURCES : [{ id: 0, name: 'Food' }, { id: 1, name: 'Water' }, { id: 2, name: 'Grain' }, { id: 3, name: 'Electricity' }, { id: 4, name: 'Cement' }, { id: 5, name: 'Metal' }, { id: 6, name: 'RawOre' }];
      invTbody.innerHTML = resList.map(r => {
        const qty = Number(userInv[r.id] ?? userInv[String(r.id)] ?? 0);
        return `<tr><td><code>#${r.id}</code></td><td><strong>${escapeHtml(r.name)}</strong></td><td><strong style="color: ${qty > 0 ? 'var(--success)' : 'var(--text-muted)'};">${qty.toLocaleString()}</strong></td><td><a href="/market/?resource=${r.id}" class="btn btn-secondary btn-sm">Trade on Market &rarr;</a></td></tr>`;
      }).join('');
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function setupAdminControls() {
  const uid = localStorage.getItem('oe_user_id'), token = getAuthToken(), card = document.getElementById('adminCashCard');
  if (!card || !token || Number(uid) !== 0) return;

  card.style.display = 'block';
  card.innerHTML = `
    <div class="card-header"><span class="card-title" style="color: var(--accent);">⚡ Admin Cash Injection (Citizen #0)</span></div>
    <form id="formAdminInject" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
      <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 140px;"><label>Target</label><select id="injectTargetType" class="form-control"><option value="user">Citizen ID</option><option value="company">Company ID</option></select></div>
      <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 110px;"><label>Target ID</label><input type="number" id="injectTargetId" class="form-control" value="0" min="0" required /></div>
      <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 130px;"><label>Amount ($)</label><input type="number" id="injectAmount" class="form-control" placeholder="10000" min="1" required /></div>
      <button type="submit" class="btn btn-primary" style="height: 38px;">Mint &amp; Inject</button>
    </form>
  `;

  document.getElementById('formAdminInject').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('injectTargetType').value, targetId = Number(document.getElementById('injectTargetId').value), amount = Number(document.getElementById('injectAmount').value);
    try {
      const res = await fetch(`${BACKEND}/cash/inject`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ amount, [type === 'company' ? 'company_id' : 'user_id']: targetId }) });
      const data = await res.json();
      if (data.status === 'success' || data.injected) {
        showAlert(`Minted and injected $${Number(data.injected || amount).toLocaleString()}!`, 'success');
        if (typeof renderAuthNav === 'function') renderAuthNav();
      } else showAlert(data.message || 'Injection failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}

async function deleteAccount() {
  const token = getAuthToken();
  if (!confirm('Are you sure you want to permanently delete your account?')) return;
  try {
    const res = await fetch(`${BACKEND}/user/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token } });
    const data = await res.json();
    if (data.status === 'success' || data.deleted_user_id) {
      localStorage.clear();
      alert('Your account has been deleted successfully.');
      window.location.href = '/';
    } else showAlert(data.message || 'Account deletion failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
