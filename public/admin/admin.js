document.addEventListener('DOMContentLoaded', async () => {
  renderAuthNav();
  const token = getAuthToken(), user = await getCurrentUser(true);
  if (!token || !user || user.id !== 0) {
    showAlert('Access denied. Administrator privileges required.', 'danger');
    return setTimeout(() => { window.location.href = '/'; }, 1200);
  }
  const sinkRes = document.getElementById('sinkResource');
  if (sinkRes && typeof RESOURCES !== 'undefined') sinkRes.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  setupAdminListeners(token); loadActiveSinks(token);
});

function setupAdminListeners(token) {
  document.getElementById('formCashMint')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('injectTargetType').value, targetId = Number(document.getElementById('injectTargetId').value), amount = Number(document.getElementById('injectAmount').value);
    try {
      const res = await fetch(`${BACKEND}/cash/inject`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ amount, [type === 'company' ? 'company_id' : 'user_id']: targetId }) }), data = await res.json();
      if (data.status === 'success' || data.injected) { showAlert(`Minted and injected $${Number(data.injected || amount).toLocaleString()}!`, 'success'); renderAuthNav(); }
      else showAlert(data.message || 'Injection failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('btnDailyReset')?.addEventListener('click', async () => {
    if (!confirm('Trigger a global daily epoch counter reset across all companies and users?')) return;
    try {
      const res = await fetch(`${BACKEND}/admin/reset`, { method: 'POST', headers: { 'Auth': token } }), data = await res.json();
      if (data.status === 'Success' || data.status === 'success') showAlert(`Daily reset initiated (Max daily shifts: ${data.max_daily_jobs || 20})!`, 'success');
      else showAlert(data.message || data.status || 'Reset failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('btnSinkBuy')?.addEventListener('click', () => executeSinkTrade('buy', token));
  document.getElementById('btnSinkSell')?.addEventListener('click', () => executeSinkTrade('sell', token));
  document.getElementById('cancelSinkForm')?.addEventListener('submit', (e) => cancelActiveSink(e, token));
}

async function executeSinkTrade(side, token) {
  const resource = Number(document.getElementById('sinkResource').value), quantity = Number(document.getElementById('sinkQuantity').value), unitPrice = Number(document.getElementById('sinkPrice').value);
  if (!quantity || !unitPrice) return showAlert('Please enter valid quantity and price.', 'danger');
  try {
    const res = await fetch(`${BACKEND}/market/${side === 'buy' ? 'buy' : 'sell'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ resource, quantity, unitPrice }) }), data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.filled_quantity !== undefined) {
      showAlert(`${side.toUpperCase()} Sink placed! Filled: ${data.filled_quantity || 0}, Remaining: ${data.remaining_quantity || 0}`, 'success');
      renderAuthNav(); loadActiveSinks(token);
    } else showAlert(data.error || data.message || data.status || 'Sink order failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}

async function loadActiveSinks(token) {
  const select = document.getElementById('cancelSinkSelect'), btn = document.getElementById('btnCancelSink');
  if (!select) return;
  try {
    const promises = (typeof RESOURCES !== 'undefined' ? RESOURCES : []).map(r => fetch(`${BACKEND}/market/depth?resource=${r.id}`).then(res => res.json()).then(d => ({ ...d, resource: r.id })).catch(() => null));
    const depthList = (await Promise.all(promises)).filter(Boolean), sinks = [];
    depthList.forEach(d => {
      const rName = (typeof RESOURCES !== 'undefined' && RESOURCES.find(r => r.id === d.resource)?.name) || `Resource #${d.resource}`;
      (d.orders || []).forEach(o => { if (o.company_id <= 0) sinks.push({ type: 'order', id: o.id, label: `[BUY SINK #${o.id}] ${o.quantity}x ${rName} @ $${Number(o.unitPrice).toFixed(2)}` }); });
      (d.offers || []).forEach(o => { if (o.company_id <= 0) sinks.push({ type: 'offer', id: o.id, label: `[SELL SINK #${o.id}] ${o.quantity}x ${rName} @ $${Number(o.unitPrice).toFixed(2)}` }); });
    });
    if (!sinks.length) { select.innerHTML = '<option value="">No active resting sinks</option>'; select.disabled = true; if (btn) btn.disabled = true; }
    else { select.disabled = false; if (btn) btn.disabled = false; select.innerHTML = sinks.map(s => `<option value="${s.type}:${s.id}">${escapeHtml(s.label)}</option>`).join(''); }
  } catch (e) {}
}

async function cancelActiveSink(e, token) {
  e.preventDefault();
  const selectedVal = document.getElementById('cancelSinkSelect')?.value;
  if (!selectedVal) return showAlert('Please select an active sink to cancel.', 'danger');
  const [type, idStr] = selectedVal.split(':'), targetId = Number(idStr);
  try {
    const res = await fetch(`${BACKEND}/market/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ [type === 'order' ? 'order_id' : 'offer_id']: targetId }) }), data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.cancelled) {
      showAlert(`Sink #${targetId} cancelled! Refunded: $${data.refunded_cash || 0} / ${data.refunded_resource_qty || 0} resources`, 'success');
      loadActiveSinks(token);
    } else showAlert(data.error || data.message || data.status || 'Cancellation failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
