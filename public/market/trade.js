async function initTradeDropdowns() {
  const compSelect = document.getElementById('tradeCompId');
  const cancelSelect = document.getElementById('cancelCompId');
  const resSelect = document.getElementById('tradeResource');
  const depthSelect = document.getElementById('selectedResourceDropdown');

  if (resSelect && typeof RESOURCES !== 'undefined') {
    resSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }
  if (depthSelect && typeof RESOURCES !== 'undefined') {
    depthSelect.innerHTML = RESOURCES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }

  const token = getAuthToken();
  if (!token || !compSelect) return;

  try {
    const res = await fetch(`${BACKEND}/company/ceo`, { headers: { 'Auth': token } });
    const data = await res.json();
    const comps = Array.isArray(data.companies) ? data.companies : [];
    const compOptions = comps.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (#${c.id})</option>`).join('');

    compSelect.innerHTML = `<option value="">Personal Consumer Sink (My Wallet)</option>${compOptions}`;
    if (cancelSelect) cancelSelect.innerHTML = `<option value="">Personal Orders</option>${compOptions}`;
  } catch (e) {}
}

async function executeTrade(side) {
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to place market orders.', 'danger');

  const compVal = document.getElementById('tradeCompId').value;
  const resource = Number(document.getElementById('tradeResource').value);
  const quantity = Number(document.getElementById('tradeQuantity').value);
  const unitPrice = Number(document.getElementById('tradePrice').value);

  if (!quantity || !unitPrice) return showAlert('Please enter valid quantity and price.', 'danger');

  if (side === 'sell' && !compVal) {
    return showAlert('Please select a company to place sell offers (selling requires company production).', 'danger');
  }

  const body = { resource, quantity, unitPrice };
  if (compVal) body.company_id = Number(compVal);

  const endpoint = side === 'buy' ? '/market/buy' : '/market/sell';

  try {
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth': token },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.status === 'success' || data.filled_quantity !== undefined) {
      const sinkNote = data.sink ? ' (Consumer Sink)' : '';
      showAlert(`${side.toUpperCase()}${sinkNote} executed! Filled: ${data.filled_quantity || 0}, Remaining: ${data.remaining_quantity || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
      if (typeof renderAuthNav === 'function') renderAuthNav();
    } else showAlert(data.message || data.status || 'Trade order failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}

async function cancelTradeOrder(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to cancel orders.', 'danger');

  const compVal = document.getElementById('cancelCompId').value;
  const orderId = document.getElementById('cancelOrderId').value;
  const offerId = document.getElementById('cancelOfferId').value;

  if (!orderId && !offerId) return showAlert('Please enter either Order ID (Buy) or Offer ID (Sell).', 'danger');

  const body = {};
  if (compVal) body.company_id = Number(compVal);
  if (orderId) body.order_id = Number(orderId);
  if (offerId) body.offer_id = Number(offerId);

  try {
    const res = await fetch(`${BACKEND}/market/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth': token },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.status === 'success' || data.cancelled) {
      showAlert(`Order cancelled! Refunded Cash: $${data.refunded_cash || 0}, Refunded Resources: ${data.refunded_resource_qty || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
    } else showAlert(data.message || data.status || 'Cancellation failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
