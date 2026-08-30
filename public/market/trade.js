async function executeTrade(side) {
  const token = getAuthToken();
  if (!token) return showAlert('You must be logged in as a CEO to place market orders.', 'danger');

  const compId = Number(document.getElementById('tradeCompId').value);
  const resource = Number(document.getElementById('tradeResource').value);
  const quantity = Number(document.getElementById('tradeQuantity').value);
  const unitPrice = Number(document.getElementById('tradePrice').value);

  if (!compId || !quantity || !unitPrice) {
    return showAlert('Please fill all trading fields.', 'danger');
  }

  const endpoint = side === 'buy' ? '/market/buy' : '/market/sell';

  try {
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth': token },
      body: JSON.stringify({
        company_id: compId,
        resource: resource,
        quantity: quantity,
        unitPrice: unitPrice
      })
    });
    const data = await res.json();

    if (data.status === 'success' || data.filled_quantity !== undefined) {
      showAlert(`${side.toUpperCase()} Order executed! Filled: ${data.filled_quantity || 0}, Remaining: ${data.remaining_quantity || 0}`, 'success');
      if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
    } else {
      showAlert(data.message || data.status || 'Trade order failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function cancelTradeOrder(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('You must be logged in as a CEO to cancel orders.', 'danger');

  const compId = Number(document.getElementById('cancelCompId').value);
  const orderId = document.getElementById('cancelOrderId').value;
  const offerId = document.getElementById('cancelOfferId').value;

  if (!compId || (!orderId && !offerId)) {
    return showAlert('Please enter Company ID and either Order ID or Offer ID.', 'danger');
  }

  const body = { company_id: compId };
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
    } else {
      showAlert(data.message || data.status || 'Cancellation failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}
