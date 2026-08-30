const BACKEND = 'https://oureconomy.server.napp9.com';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadStores();

  document.getElementById('btnSimTick').addEventListener('click', runSimTick);
  setupPriceForm();
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

async function loadStores() {
  const grid = document.getElementById('storesGrid');
  grid.innerHTML = '<p style="color: var(--text-muted);">Loading stores...</p>';

  try {
    const res = await fetch(`${BACKEND}/list/companies?type=2`);
    const stores = await res.json();

    if (!Array.isArray(stores) || stores.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted);">No WebStores found. Anyone can found one!</p>';
      return;
    }

    grid.innerHTML = stores.map(s => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏪 ${escapeHtml(s.name)}</span>
          <span class="badge badge-store">WebStore</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Treasury: <strong>$${Number(s.cash || 0).toLocaleString()}</strong><br>
          Store ID: <strong>#${s.id}</strong>
        </p>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="qty-store-${s.id}" min="1" value="1" class="form-control" style="width: 80px;" />
          <button class="btn btn-success btn-sm" onclick="buyStoreFood(${s.id})">Buy Food</button>
          <a href="/company/?id=${s.id}" class="btn btn-secondary btn-sm">Profile</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
}

window.buyStoreFood = async function(storeId) {
  const token = localStorage.getItem('oe_token');
  if (!token) return showAlert('Please login to buy from a WebStore.', 'danger');

  const qtyInput = document.getElementById(`qty-store-${storeId}`);
  const quantity = qtyInput ? Number(qtyInput.value) : 1;

  try {
    const res = await fetch(`${BACKEND}/store/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth': token },
      body: JSON.stringify({ company_id: storeId, quantity: quantity })
    });
    const data = await res.json();

    if (data.status === 'success' || data.total_cost !== undefined) {
      showAlert(`Successfully bought ${data.quantity} food for $${data.total_cost}! Electricity consumed: ${data.electricity_used}`, 'success');
      loadStores();
    } else {
      showAlert(data.message || data.status || 'Purchase failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
};

async function runSimTick() {
  try {
    const res = await fetch(`${BACKEND}/store/tick`, { method: 'POST' });
    const data = await res.json();

    if (data.purchased) {
      showAlert(`NPC Consumer Tick: Purchased ${data.quantity} food units from ${data.store_name} for $${data.revenue}!`, 'success');
      loadStores();
    } else {
      showAlert(data.message || 'No NPC purchase took place this tick.', 'info');
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

function setupPriceForm() {
  const form = document.getElementById('storePriceForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('oe_token');
    if (!token) return showAlert('You must be logged in as CEO.', 'danger');

    const compId = Number(document.getElementById('priceStoreId').value);
    const price = Number(document.getElementById('priceStoreValue').value);

    try {
      const res = await fetch(`${BACKEND}/store/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Auth': token },
        body: JSON.stringify({ company_id: compId, price: price })
      });
      const data = await res.json();
      if (data.status === 'success' || data.price !== undefined) {
        showAlert(`Store food price updated to $${data.price}!`, 'success');
      } else {
        showAlert(data.message || 'Price update failed', 'danger');
      }
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
