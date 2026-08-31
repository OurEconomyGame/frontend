let _ceoCompanyInventories = {};

async function fetchCompanyInventory(compId) {
  if (!compId) return {};
  if (_ceoCompanyInventories[compId]) return _ceoCompanyInventories[compId];
  const token = getAuthToken();
  try {
    const res = await fetch(`${BACKEND}/company?id=${compId}`, { headers: token ? { 'Auth': token } : {} }), data = await res.json(), c = data.company || data;
    const inv = (c.data && c.data.inventory) || c.inventory || {};
    _ceoCompanyInventories[compId] = inv; return inv;
  } catch (e) { return {}; }
}

async function syncTradeQuantity() {
  const compVal = document.getElementById('tradeCompId')?.value, resVal = Number(document.getElementById('tradeResource')?.value || 0), qtyInput = document.getElementById('tradeQuantity');
  if (!qtyInput || !compVal) return;
  const inv = await fetchCompanyInventory(compVal), maxStock = Number(inv[resVal] ?? inv[String(resVal)] ?? 0);
  if (maxStock > 0) qtyInput.value = maxStock;
}

async function checkIsAdmin(token) {
  let uid = localStorage.getItem('oe_user_id');
  if (uid === null && token) {
    try {
      const res = await fetch(`${BACKEND}/portfolio`, { headers: { 'Auth': token } }), data = await res.json();
      if (data.user?.id !== undefined) { uid = String(data.user.id); localStorage.setItem('oe_user_id', uid); }
    } catch (e) {}
  }
  return uid !== null && Number(uid) === 0;
}

async function initTradeDropdowns() {
  const compSelect = document.getElementById('tradeCompId'), cancelSelect = document.getElementById('cancelCompId'), resSelect = document.getElementById('tradeResource'), depthSelect = document.getElementById('selectedResourceDropdown');
  if (resSelect && typeof RESOURCES !== 'undefined') resSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  if (depthSelect && typeof RESOURCES !== 'undefined') depthSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

  const token = getAuthToken();
  if (!token || !compSelect) return;
  const isAdmin = await checkIsAdmin(token);

  try {
    const res = await fetch(`${BACKEND}/company/ceo`, { headers: { 'Auth': token } }), data = await res.json(), comps = Array.isArray(data.companies) ? data.companies : [];
    comps.forEach(c => { if (c.data && c.data.inventory) _ceoCompanyInventories[c.id] = c.data.inventory; });
    const compOptions = comps.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (#${c.id})</option>`).join('');
    compSelect.innerHTML = `${isAdmin ? '<option value="">Personal Consumer Sink (My Wallet)</option>' : (comps.length ? '<option value="">Select Company...</option>' : '<option value="">No CEO Companies</option>')}${compOptions}`;
    if (cancelSelect) cancelSelect.innerHTML = `${isAdmin ? '<option value="">Personal Orders (Sink)</option>' : (comps.length ? '<option value="">Select Company...</option>' : '')}${compOptions}`;
    syncTradeQuantity();
  } catch (e) {}
}

async function executeTrade(side) {
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to place market orders.', 'danger');
  const compVal = document.getElementById('tradeCompId').value, resource = Number(document.getElementById('tradeResource').value), quantity = Number(document.getElementById('tradeQuantity').value), unitPrice = Number(document.getElementById('tradePrice').value);
  const isAdmin = await checkIsAdmin(token);

  if (!quantity || !unitPrice) return showAlert('Please enter valid quantity and price.', 'danger');
  if (side === 'sell' && !compVal) return showAlert('Please select a company to place sell offers.', 'danger');
  if (side === 'buy' && !compVal && !isAdmin) return showAlert('Please select a company (personal consumer sinks are restricted to admin).', 'danger');

  const body = { resource, quantity, unitPrice };
  if (compVal) body.company_id = Number(compVal);

  try {
    const res = await fetch(`${BACKEND}/market/${side === 'buy' ? 'buy' : 'sell'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.filled_quantity !== undefined) {
      if (compVal) delete _ceoCompanyInventories[compVal];
      showAlert(`${side.toUpperCase()}${data.sink || (!compVal && isAdmin) ? ' (Consumer Sink)' : ''} executed! Filled: ${data.filled_quantity || 0}, Remaining: ${data.remaining_quantity || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
      if (typeof renderAuthNav === 'function') renderAuthNav();
      syncTradeQuantity();
    } else showAlert(data.error || data.message || data.status || 'Trade order failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}

async function cancelTradeOrder(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to cancel orders.', 'danger');
  const compVal = document.getElementById('cancelCompId').value, orderId = document.getElementById('cancelOrderId').value, offerId = document.getElementById('cancelOfferId').value;
  if (!orderId && !offerId) return showAlert('Please enter either Order ID or Offer ID.', 'danger');

  const body = {};
  if (compVal) body.company_id = Number(compVal);
  if (orderId) body.order_id = Number(orderId);
  if (offerId) body.offer_id = Number(offerId);

  try {
    const res = await fetch(`${BACKEND}/market/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.status === 'success' || data.status === 'Success' || data.cancelled) {
      if (compVal) delete _ceoCompanyInventories[compVal];
      showAlert(`Order cancelled! Refunded Cash: $${data.refunded_cash || 0}, Refunded Resources: ${data.refunded_resource_qty || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
      syncTradeQuantity();
    } else showAlert(data.error || data.message || data.status || 'Cancellation failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
