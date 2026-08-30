const BACKEND = 'https://oureconomy.server.napp9.com:443';

const RESOURCES = [
  { id: 0, name: 'Resource #0 (Electricity / Energy)' },
  { id: 1, name: 'Resource #1 (Water / Raw)' },
  { id: 2, name: 'Resource #2 (Food)' }
];

let pollingInterval = null;
let isPollingActive = true;
let selectedResourceId = 0;

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  fetchAllCommodities();
  startPolling();

  document.getElementById('btnTogglePolling').addEventListener('click', togglePolling);
  document.getElementById('selectedResourceDropdown').addEventListener('change', (e) => {
    selectedResourceId = Number(e.target.value);
    updateSelectedDepthView();
  });

  document.getElementById('btnMarketBuy').addEventListener('click', () => executeTrade('buy'));
  document.getElementById('btnMarketSell').addEventListener('click', () => executeTrade('sell'));
  document.getElementById('cancelForm').addEventListener('submit', cancelTradeOrder);
});

function renderAuthNav() {
  const token = localStorage.getItem('oe_token');
  const user = localStorage.getItem('oe_username');
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (token) {
    navAuth.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">👤 ${user || 'Citizen'}</span>
      <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      localStorage.removeItem('oe_token');
      localStorage.removeItem('oe_username');
      window.location.reload();
    });
  }
}

function showAlert(msg, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = `alert alert-${type} visible`;
  alertBox.textContent = msg;
}

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => {
    if (isPollingActive) {
      fetchAllCommodities();
    }
  }, 3000);
}

function togglePolling() {
  isPollingActive = !isPollingActive;
  const btn = document.getElementById('btnTogglePolling');
  const dot = document.getElementById('pollingDot');
  const status = document.getElementById('pollingStatus');

  if (isPollingActive) {
    btn.textContent = 'Pause Feed';
    dot.className = 'status-dot online';
    status.textContent = 'Active (3s)';
    fetchAllCommodities();
  } else {
    btn.textContent = 'Resume Feed';
    dot.className = 'status-dot offline';
    status.textContent = 'Paused';
  }
}

// Fetch orderbook data for all commodities simultaneously
async function fetchAllCommodities() {
  const summaryBody = document.getElementById('commoditiesSummaryBody');
  const results = [];

  try {
    const promises = RESOURCES.map(r =>
      fetch(`${BACKEND}/market/depth?resource=${r.id}`)
        .then(res => res.json())
        .catch(err => ({ error: true, resource: r.id, message: err.message }))
    );

    const dataList = await Promise.all(promises);

    summaryBody.innerHTML = dataList.map((data, index) => {
      const resource = RESOURCES[index];
      const orders = data.orders || [];
      const offers = data.offers || [];

      const bestBid = orders.length > 0 ? Number(orders[0].unitPrice) : null;
      const bestAsk = offers.length > 0 ? Number(offers[0].unitPrice) : null;
      const spread = (bestBid !== null && bestAsk !== null) ? `$${(bestAsk - bestBid).toFixed(2)}` : '—';

      const totalBidQty = orders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
      const totalAskQty = offers.reduce((sum, o) => sum + Number(o.quantity || 0), 0);

      // If this matches currently selected depth view, update the detailed panels
      if (resource.id === selectedResourceId) {
        renderDetailedDepth(orders, offers);
      }

      return `
        <tr>
          <td><strong>${resource.name}</strong></td>
          <td style="color: var(--success); font-weight: 600;">${bestBid !== null ? `$${bestBid.toFixed(2)}` : '—'}</td>
          <td style="color: var(--danger); font-weight: 600;">${bestAsk !== null ? `$${bestAsk.toFixed(2)}` : '—'}</td>
          <td>${spread}</td>
          <td>${totalBidQty.toLocaleString()}</td>
          <td>${totalAskQty.toLocaleString()}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="selectDepthResource(${resource.id})">Inspect Depth</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Periodic market fetch error:', err);
  }
}

window.selectDepthResource = function(id) {
  selectedResourceId = Number(id);
  document.getElementById('selectedResourceDropdown').value = id;
  document.getElementById('tradeResource').value = id;
  updateSelectedDepthView();
  fetchAllCommodities();
};

function updateSelectedDepthView() {
  const resource = RESOURCES.find(r => r.id === selectedResourceId) || RESOURCES[0];
  document.getElementById('selectedResourceTitle').textContent = `📖 Orderbook Depth: ${resource.name}`;
}

function renderDetailedDepth(orders, offers) {
  const bidsBody = document.getElementById('bidsTableBody');
  const asksBody = document.getElementById('asksTableBody');

  if (bidsBody) {
    bidsBody.innerHTML = orders.length ? orders.map(o => `
      <tr>
        <td style="color: var(--success); font-weight: 600;">$${Number(o.unitPrice).toFixed(2)}</td>
        <td>${Number(o.quantity).toLocaleString()}</td>
        <td>Company #${o.company_id || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No active buy orders</td></tr>';
  }

  if (asksBody) {
    asksBody.innerHTML = offers.length ? offers.map(o => `
      <tr>
        <td style="color: var(--danger); font-weight: 600;">$${Number(o.unitPrice).toFixed(2)}</td>
        <td>${Number(o.quantity).toLocaleString()}</td>
        <td>Company #${o.company_id || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No active sell offers</td></tr>';
  }
}

async function executeTrade(side) {
  const token = localStorage.getItem('oe_token');
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
      fetchAllCommodities();
    } else {
      showAlert(data.message || data.status || 'Trade order failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function cancelTradeOrder(e) {
  e.preventDefault();
  const token = localStorage.getItem('oe_token');
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
      showAlert(`Order #${data.id} cancelled! Refunded Cash: $${data.refunded_cash || 0}, Refunded Resources: ${data.refunded_resource_qty || 0}`, 'success');
      fetchAllCommodities();
    } else {
      showAlert(data.message || data.status || 'Cancellation failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}
