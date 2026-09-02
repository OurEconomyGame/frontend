let _ceoCompanyInventories = {};
async function fetchCompanyInventory(cId) {
  if (!cId) return {}; if (_ceoCompanyInventories[cId]) return _ceoCompanyInventories[cId];
  const token = getAuthToken();
  try {
    const res = await fetch(`${BACKEND}/company?id=${cId}`, { headers: token ? { 'Auth': token } : {} }), data = await res.json(), c = data.company || data, inv = (c.data && c.data.inventory) || c.inventory || {};
    _ceoCompanyInventories[cId] = inv; return inv;
  } catch (e) { return {}; }
}
async function syncTradeQuantity() {
  const compVal = document.getElementById('tradeCompId')?.value, resVal = Number(document.getElementById('tradeResource')?.value || 0), qtyInput = document.getElementById('tradeQuantity');
  if (!qtyInput || !compVal) return;
  const inv = await fetchCompanyInventory(compVal), maxStock = Number(inv[resVal] ?? inv[String(resVal)] ?? 0);
  if (maxStock > 0) qtyInput.value = maxStock;
}
function updateCancelDropdown() {
  const compVal = document.getElementById('cancelCompId')?.value || document.getElementById('tradeCompId')?.value || '', select = document.getElementById('cancelOrderSelect'), btn = document.getElementById('btnCancelOrder');
  if (!select) return;
  const targetId = Number(compVal), cache = window._marketDepthCache || [], matches = [];
  if (targetId > 0) {
    cache.forEach(d => {
      const rName = (typeof RESOURCES !== 'undefined' && RESOURCES.find(r => r.id === d.resource)?.name) || `Resource #${d.resource}`;
      (d.orders || []).forEach(o => { if (o.company_id === targetId) matches.push({ type: 'order', id: o.id, label: `[BUY #${o.id}] ${o.quantity}x ${rName} @ $${Number(o.unitPrice).toFixed(2)}` }); });
      (d.offers || []).forEach(o => { if (o.company_id === targetId) matches.push({ type: 'offer', id: o.id, label: `[SELL #${o.id}] ${o.quantity}x ${rName} @ $${Number(o.unitPrice).toFixed(2)}` }); });
    });
  }
  if (!matches.length) { select.innerHTML = '<option value="">No active resting orders</option>'; select.disabled = true; if (btn) btn.disabled = true; }
  else { select.disabled = false; if (btn) btn.disabled = false; select.innerHTML = matches.map(m => `<option value="${m.type}:${m.id}">${escapeHtml(m.label)}</option>`).join(''); }
}
async function initTradeDropdowns() {
  const compSelect = document.getElementById('tradeCompId'), cancelSelect = document.getElementById('cancelCompId'), resSelect = document.getElementById('tradeResource'), depthSelect = document.getElementById('selectedResourceDropdown'), token = getAuthToken();
  if (resSelect && typeof RESOURCES !== 'undefined') resSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  if (depthSelect && typeof RESOURCES !== 'undefined') depthSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  if (!token || !compSelect) return;
  try {
    const res = await fetch(`${BACKEND}/company/ceo`, { headers: { 'Auth': token } }), data = await res.json(), comps = Array.isArray(data.companies) ? data.companies : [];
    comps.forEach(c => { if (c.data && c.data.inventory) _ceoCompanyInventories[c.id] = c.data.inventory; });
    const compOptions = comps.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (#${c.id})</option>`).join('');
    const defaultOpt = comps.length ? '<option value="">Select Company...</option>' : '<option value="">No CEO Companies</option>';
    compSelect.innerHTML = `${defaultOpt}${compOptions}`;
    if (cancelSelect) cancelSelect.innerHTML = `${defaultOpt}${compOptions}`;
    syncTradeQuantity(); updateCancelDropdown();
  } catch (e) {}
}
async function executeTrade(side) {
  const token = getAuthToken(); if (!token) return showAlert('Please log in to place market orders.', 'danger');
  const compVal = document.getElementById('tradeCompId').value, resource = Number(document.getElementById('tradeResource').value), quantity = Number(document.getElementById('tradeQuantity').value), unitPrice = Number(document.getElementById('tradePrice').value);
  if (!quantity || !unitPrice) return showAlert('Please enter valid quantity and price.', 'danger');
  if (!compVal) return showAlert('Please select a company to place market orders.', 'danger');
  try {
    const res = await fetch(`${BACKEND}/market/${side === 'buy' ? 'buy' : 'sell'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compVal), resource, quantity, unitPrice }) }), data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.filled_quantity !== undefined) {
      delete _ceoCompanyInventories[compVal];
      showAlert(`${side.toUpperCase()} order executed! Filled: ${data.filled_quantity || 0}, Remaining: ${data.remaining_quantity || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities(); if (typeof renderAuthNav === 'function') renderAuthNav(); syncTradeQuantity();
    } else showAlert(data.error || data.message || data.status || 'Trade order failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
async function cancelTradeOrder(e) {
  e.preventDefault();
  const token = getAuthToken(); if (!token) return showAlert('Please log in to cancel orders.', 'danger');
  const compVal = document.getElementById('cancelCompId')?.value || document.getElementById('tradeCompId')?.value || '', selectedVal = document.getElementById('cancelOrderSelect')?.value;
  if (!selectedVal) return showAlert('Please select an active order to cancel.', 'danger');
  const [type, idStr] = selectedVal.split(':'), targetId = Number(idStr), body = { company_id: Number(compVal), [type === 'order' ? 'order_id' : 'offer_id']: targetId };
  try {
    const res = await fetch(`${BACKEND}/market/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body) }), data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.cancelled) {
      if (compVal) delete _ceoCompanyInventories[compVal];
      showAlert(`Order #${targetId} cancelled! Refund: $${data.refunded_cash || 0} / ${data.refunded_resource_qty || 0} resources`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities(); syncTradeQuantity();
    } else showAlert(data.error || data.message || data.status || 'Cancellation failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
