const urlParams = new URLSearchParams(window.location.search), targetUserId = urlParams.get('user') || urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  if (targetUserId !== null) loadPublicPortfolio(Number(targetUserId));
  else { loadPortfolio(); setupMintControls(); }
});

async function loadPortfolio() {
  const token = getAuthToken(), tbody = document.getElementById('portfolioTableBody'), invTbody = document.getElementById('userInventoryTableBody'), dangerCard = document.getElementById('accountDangerCard');
  if (!token) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view portfolio.</td></tr>';
    if (invTbody) invTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view inventory.</td></tr>';
    return;
  }
  if (dangerCard) { dangerCard.style.display = 'block'; document.getElementById('btnDeleteUser').addEventListener('click', deleteAccount); }

  try {
    const res = await fetch(`${BACKEND}/portfolio`, { headers: { 'Auth': token } }), data = await res.json(), list = data.portfolio || [];
    if (tbody) tbody.innerHTML = !list.length ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No owned shares.</td></tr>' : list.map(item => `<tr><td><strong>#${item.company_id}</strong></td><td>${escapeHtml(item.company_name)}</td><td>${Number(item.quantity).toLocaleString()}</td><td>${Number(item.shares_outstanding).toLocaleString()}</td><td><strong style="color: var(--primary);">${item.ownership_percentage}%</strong></td><td><a href="/company/?id=${item.company_id}" class="btn btn-secondary btn-sm">Company Page</a></td></tr>`).join('');

    if (invTbody) {
      const userInv = (data.user && data.user.inventory) || data.inventory || {}, resList = typeof RESOURCES !== 'undefined' ? RESOURCES : [];
      invTbody.innerHTML = resList.map(r => {
        const qty = Number(userInv[r.id] ?? 0);
        const action = (r.id === 0 && qty > 0) ? `<button class="btn btn-primary btn-sm" onclick="consumeFood()">Eat Food (Reset Shifts)</button>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>';
        return `<tr><td><code>#${r.id}</code></td><td><strong>${escapeHtml(r.name)}</strong></td><td><strong style="color: ${qty > 0 ? 'var(--success)' : 'var(--text-muted)'};">${qty.toLocaleString()}</strong></td><td>${action}</td></tr>`;
      }).join('');
    }
  } catch (err) { if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

window.consumeFood = async function() {
  const token = getAuthToken();
  if (!token) return showAlert('Please login to consume food.', 'danger');
  if (!confirm('Consume 1 Food ration to reset your 20 daily work shifts?')) return;
  try {
    const res = await fetch(`${BACKEND}/use/food`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token } }), data = await res.json();
    if (data.status === 'Success' || data.food_consumed !== undefined) {
      showAlert(`Ate 1 Food! Daily work shifts reset (Remaining: ${data.works_left ?? 20})!`, 'success');
      loadPortfolio(); if (typeof renderAuthNav === 'function') renderAuthNav();
    } else showAlert(data.message || data.status || 'Food consumption failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
};

async function loadPublicPortfolio(userId) {
  const userMap = await getUserMap(), userName = userMap[userId] || `Citizen #${userId}`, tbody = document.getElementById('portfolioTableBody'), invCard = document.getElementById('userInventoryTableBody')?.closest('.card');
  document.querySelector('.page-header h1').textContent = `${userName}'s Portfolio`;
  document.querySelector('.page-header p').innerHTML = `Public equity holdings for ${userName}. <a href="/messages/?to=${userId}" class="btn btn-primary btn-sm" style="margin-left: 8px;">✉️ Send Message</a>`;
  if (invCard) invCard.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND}/user?id=${userId}`), data = await res.json(), holdings = (data.user && Array.isArray(data.user.shareholdings)) ? data.user.shareholdings : [];
    if (!holdings.length) return tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">${userName} does not own shares.</td></tr>`;
    tbody.innerHTML = holdings.map(item => `<tr><td><strong>#${item.company_id}</strong></td><td>${escapeHtml(item.company_name)}</td><td>${Number(item.quantity).toLocaleString()}</td><td>${Number(item.shares_outstanding).toLocaleString()}</td><td><strong style="color: var(--primary);">${item.ownership_percentage}%</strong></td><td><a href="/company/?id=${item.company_id}" class="btn btn-secondary btn-sm">Company Page</a></td></tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

function setupMintControls() {
  const uid = localStorage.getItem('oe_user_id'), token = getAuthToken(), card = document.getElementById('cashMintCard');
  if (!card || !token || Number(uid) !== 0) return;
  card.style.display = 'block';
  card.innerHTML = `<div class="card-header" style="justify-content: space-between; flex-wrap: wrap; gap: 8px;"><span class="card-title" style="color: var(--accent);">⚡ Cash Minting &amp; Daily Reset</span><button id="btnDailyReset" class="btn btn-secondary btn-sm" style="border-color: var(--accent);">🔄 Trigger Daily Reset</button></div><form id="formCashMint" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;"><div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 140px;"><label>Target</label><select id="injectTargetType" class="form-control"><option value="user">Citizen ID</option><option value="company">Company ID</option></select></div><div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 110px;"><label>Target ID</label><input type="number" id="injectTargetId" class="form-control" value="0" min="0" required /></div><div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 130px;"><label>Amount ($)</label><input type="number" id="injectAmount" class="form-control" placeholder="10000" min="1" required /></div><button type="submit" class="btn btn-primary" style="height: 38px;">Mint &amp; Inject</button></form>`;

  document.getElementById('formCashMint').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('injectTargetType').value, targetId = Number(document.getElementById('injectTargetId').value), amount = Number(document.getElementById('injectAmount').value);
    try {
      const res = await fetch(`${BACKEND}/cash/inject`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ amount, [type === 'company' ? 'company_id' : 'user_id']: targetId }) });
      const data = await res.json();
      if (data.status === 'success' || data.injected) { showAlert(`Minted and injected $${Number(data.injected || amount).toLocaleString()}!`, 'success'); if (typeof renderAuthNav === 'function') renderAuthNav(); }
      else showAlert(data.message || 'Injection failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('btnDailyReset').addEventListener('click', async () => {
    if (!confirm('Trigger a global daily epoch counter reset across all companies and users?')) return;
    try {
      const res = await fetch(`${BACKEND}/admin/reset`, { method: 'POST', headers: { 'Auth': token } });
      const data = await res.json();
      if (data.status === 'Success' || data.status === 'success') showAlert(`Daily reset initiated (Max daily shifts: ${data.max_daily_jobs || 20})!`, 'success');
      else showAlert(data.message || data.status || 'Reset failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}

async function deleteAccount() {
  const token = getAuthToken();
  if (!confirm('Are you sure you want to permanently delete your account?')) return;
  try {
    const res = await fetch(`${BACKEND}/user/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token } });
    const data = await res.json();
    if (data.status === 'success' || data.deleted_user_id) { localStorage.clear(); alert('Account deleted.'); window.location.href = '/'; }
    else showAlert(data.message || 'Account deletion failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
