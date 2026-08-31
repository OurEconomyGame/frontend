document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadStores();
});

async function loadStores() {
  const grid = document.getElementById('storesGrid'), token = getAuthToken();

  try {
    const res = await fetch(`${BACKEND}/list/companies?type=2`, { headers: token ? { 'Auth': token } : {} });
    const stores = await res.json();
    if (!Array.isArray(stores) || !stores.length) {
      grid.innerHTML = '<p style="color: var(--text-muted);">No WebStores currently open. <a href="/found/" style="color: var(--primary);">Found one</a> to start selling!</p>';
      return;
    }

    const cards = await Promise.all(stores.map(async (s) => {
      const price = Number(s.price ?? s.food_price ?? (s.data && (s.data.food_price || s.data.price)) ?? 25);
      const inv = (s.inventory || (s.data && s.data.inventory)) || {};
      const foodStock = Number(inv[0] ?? inv['0'] ?? 0), elecStock = Number(inv[3] ?? inv['3'] ?? 0);
      const ceoLabel = await renderUserLink(s.ceo);
      const lowFood = foodStock < 100 ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">⚠️ Low</span>' : '';
      const lowElec = elecStock < 100 ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">⚠️ Low</span>' : '';

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="card-header"><span class="card-title">🏪 ${escapeHtml(s.name)}</span><span class="badge badge-store">#${s.id}</span></div>
            <div style="margin: 10px 0;">
              <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent); margin: 0 0 8px 0;">$${price.toFixed(2)} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">/ Food unit</span></p>
              <p style="font-size: 0.85rem; margin: 4px 0;">📦 <strong>Food Stock:</strong> ${foodStock.toLocaleString()} units ${lowFood}</p>
              <p style="font-size: 0.85rem; margin: 4px 0;">⚡ <strong>Grid Power:</strong> ${elecStock.toLocaleString()} kWh ${lowElec}</p>
              <p style="font-size: 0.85rem; margin: 4px 0; color: var(--text-muted);">👑 <strong>CEO:</strong> ${ceoLabel}</p>
              <p style="font-size: 0.85rem; margin: 4px 0; color: var(--text-muted);">💵 <strong>Treasury:</strong> ${formatCash(s.cash)}</p>
            </div>
          </div>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; align-items: center;">
            <input type="number" id="qty-store-${s.id}" min="1" max="${Math.max(1, foodStock)}" value="1" class="form-control" style="width: 75px;" />
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="buyStoreFood(${s.id})">Buy Food</button>
            <a href="/company/?id=${s.id}" class="btn btn-secondary btn-sm">Profile</a>
          </div>
        </div>
      `;
    }));
    grid.innerHTML = cards.join('');
  } catch (err) { grid.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`; }
}

window.buyStoreFood = async function(storeId) {
  const token = getAuthToken();
  if (!token) return showAlert('Please login to buy from a WebStore.', 'danger');
  const qtyInput = document.getElementById(`qty-store-${storeId}`);
  const quantity = qtyInput ? Number(qtyInput.value) : 1;
  try {
    const res = await fetch(`${BACKEND}/store/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: storeId, quantity }) });
    const data = await res.json();
    if (data.status === 'success' || data.total_cost !== undefined) {
      showAlert(`Bought ${data.quantity || quantity} Food for $${data.total_cost || 0}! Consumed: ${data.electricity_used || 0} kWh`, 'success');
      loadStores(); if (typeof renderAuthNav === 'function') renderAuthNav();
    } else showAlert(data.message || data.status || 'Purchase failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
};
