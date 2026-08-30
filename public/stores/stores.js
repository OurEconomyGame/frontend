document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadStores();
  if (typeof setupPriceForm === 'function') setupPriceForm();
});

async function loadStores() {
  const grid = document.getElementById('storesGrid');

  try {
    const res = await fetch(`${BACKEND}/list/companies?type=2`);
    const stores = await res.json();

    if (!Array.isArray(stores) || stores.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted);">No WebStores currently open. <a href="/found/" style="color: var(--primary);">Found one</a> to start selling!</p>';
      return;
    }

    grid.innerHTML = stores.map(s => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏪 ${escapeHtml(s.name)}</span>
          <span class="badge badge-store">WebStore</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Treasury: <strong>${formatCash(s.cash)}</strong><br>
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
  const token = getAuthToken();
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
