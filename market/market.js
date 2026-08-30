const BACKEND = 'https://oureconomy.server.napp9.com';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadDepth();

  document.getElementById('resourceSelect').addEventListener('change', loadDepth);
  document.getElementById('btnMarketBuy').addEventListener('click', () => executeTrade('buy'));
  document.getElementById('btnMarketSell').addEventListener('click', () => executeTrade('sell'));
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

async function loadDepth() {
  const resource = document.getElementById('resourceSelect').value;
  const bidsBody = document.getElementById('bidsTableBody');
  const asksBody = document.getElementById('asksTableBody');

  bidsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Loading bids...</td></tr>';
  asksBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Loading asks...</td></tr>';

  try {
    const res = await fetch(`${BACKEND}/market/depth?resource=${resource}`);
    const data = await res.json();
    const orders = data.orders || [];
    const offers = data.offers || [];

    bidsBody.innerHTML = orders.length ? orders.map(o => `
      <tr>
        <td style="color: var(--success); font-weight: 600;">$${o.unitPrice}</td>
        <td>${o.quantity}</td>
        <td>Company #${o.company_id || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No open bids</td></tr>';

    asksBody.innerHTML = offers.length ? offers.map(o => `
      <tr>
        <td style="color: var(--danger); font-weight: 600;">$${o.unitPrice}</td>
        <td>${o.quantity}</td>
        <td>Company #${o.company_id || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No open offers</td></tr>';
  } catch (err) {
    bidsBody.innerHTML = `<tr><td colspan="3" style="color: var(--danger);">${err.message}</td></tr>`;
    asksBody.innerHTML = `<tr><td colspan="3" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function executeTrade(side) {
  const token = localStorage.getItem('oe_token');
  if (!token) return showAlert('You must be logged in as a CEO to trade on the market.', 'danger');

  const compId = Number(document.getElementById('tradeCompId').value);
  const resource = Number(document.getElementById('resourceSelect').value);
  const quantity = Number(document.getElementById('tradeQuantity').value);
  const unitPrice = Number(document.getElementById('tradePrice').value);

  if (!compId || !quantity || !unitPrice) {
    return showAlert('Please enter all trade fields.', 'danger');
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
      loadDepth();
    } else {
      showAlert(data.message || data.status || 'Trade order failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}
