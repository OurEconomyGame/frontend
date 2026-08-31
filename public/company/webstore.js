async function renderStorefront(c, isCeo) {
  const container = document.getElementById('storeListingsContent');
  if (!container) return;

  const inv = (c.data && c.data.inventory) ? c.data.inventory : (c.inventory || {});
  const foodStock = Number(inv[0] ?? inv['0'] ?? 0), elecStock = Number(inv[3] ?? inv['3'] ?? 0);
  const foodPrice = Number(c.food_price ?? c.price ?? (c.data && (c.data.food_price || c.data.price)) ?? 25);

  let lowWarning = '';
  const lowItems = [];
  if (foodStock < 100) lowItems.push(`Food (${foodStock} in stock)`);
  if (elecStock < 100) lowItems.push(`Electricity (${elecStock} in stock)`);
  if (lowItems.length > 0) {
    lowWarning = `<div class="alert alert-danger visible" style="margin-bottom: 16px;">⚠️ <strong>Store Inventory Warning:</strong> Running low (&lt;100 units): ${lowItems.join(', ')}.</div>`;
  }

  const priceControl = isCeo ? `
    <div style="margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.08); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
      <strong>🛠️ CEO Retail Pricing:</strong>
      <form id="formStorePrice" style="display: flex; gap: 8px; margin-top: 8px; align-items: center;" onsubmit="handleStorePriceChange(event, ${c.id})">
        <input type="number" id="inputStoreFoodPrice" class="form-control" value="${foodPrice}" min="1" step="0.5" style="max-width: 140px;" required />
        <button type="submit" class="btn btn-primary btn-sm">Update Price</button>
      </form>
    </div>` : '';

  container.innerHTML = `
    ${lowWarning}
    <div class="grid-2" style="gap: 16px; margin-bottom: 16px;">
      <div class="card" style="border: 1px solid var(--border-color);"><div class="card-header"><span class="card-title">🍲 Retail Food Package</span></div><p style="font-size: 1.4rem; font-weight: 700; color: var(--accent); margin: 6px 0;">$${foodPrice.toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">/ unit</span></p><p style="color: var(--text-muted); font-size: 0.85rem;">Stock: <strong style="color: ${foodStock < 100 ? 'var(--danger)' : 'var(--success)'};">${foodStock.toLocaleString()} units ${foodStock < 100 ? '(⚠️ Low)' : ''}</strong></p></div>
      <div class="card" style="border: 1px solid var(--border-color);"><div class="card-header"><span class="card-title">⚡ Store Power Grid</span></div><p style="font-size: 1.4rem; font-weight: 700; color: var(--primary); margin: 6px 0;">${elecStock.toLocaleString()} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">kWh</span></p><p style="color: var(--text-muted); font-size: 0.85rem;">Requires 10 Electricity per sale transaction.</p></div>
    </div>
    <form onsubmit="handleStorePurchase(event, ${c.id})" style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
      <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 140px;"><label>Purchase Quantity</label><input type="number" id="inputStoreBuyQty" class="form-control" value="1" min="1" max="${Math.max(1, foodStock)}" required /></div>
      <button type="submit" class="btn btn-primary" style="height: 38px;">🛒 Buy Food from Store</button>
    </form>
    ${priceControl}
  `;
}

async function handleStorePurchase(e, compId) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to purchase from WebStore.', 'danger');
  const qty = Number(document.getElementById('inputStoreBuyQty').value);
  try {
    const res = await fetch(`${BACKEND}/store/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: compId, quantity: qty }) });
    const data = await res.json();
    if (data.status === 'success' || data.quantity) {
      showAlert(`Purchased ${data.quantity || qty} Food for $${data.total_cost || 0}!`, 'success');
      loadCompanyDetails(); if (typeof renderAuthNav === 'function') renderAuthNav();
    } else showAlert(data.message || data.status || 'Purchase failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}

async function handleStorePriceChange(e, compId) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('Please log in as CEO.', 'danger');
  const price = Number(document.getElementById('inputStoreFoodPrice').value);
  try {
    const res = await fetch(`${BACKEND}/store/price`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: compId, price }) });
    const data = await res.json();
    if (data.status === 'Success' || data.status === 'success' || data.price) {
      showAlert(`WebStore retail price updated to $${data.price || price}!`, 'success');
      loadCompanyDetails();
    } else showAlert(data.message || data.status || 'Price update failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
