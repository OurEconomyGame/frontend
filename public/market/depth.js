let selectedResourceId = 0;

window.selectDepthResource = function(id) {
  selectedResourceId = Number(id);
  const dropdown = document.getElementById('selectedResourceDropdown'), tradeInput = document.getElementById('tradeResource');
  if (dropdown) dropdown.value = id;
  if (tradeInput) tradeInput.value = id;
  updateSelectedDepthView();
  if (typeof fetchAllCommodities === 'function') fetchAllCommodities();
  if (typeof syncTradeQuantity === 'function') syncTradeQuantity();
};

function updateSelectedDepthView() {
  const resource = (typeof RESOURCES !== 'undefined' && RESOURCES.find(r => r.id === selectedResourceId)) || { name: `Resource #${selectedResourceId}` };
  const title = document.getElementById('selectedResourceTitle');
  if (title) title.textContent = `📖 Orderbook Depth: ${resource.name}`;
}

function renderDetailedDepth(orders, offers) {
  const bidsBody = document.getElementById('bidsTableBody'), asksBody = document.getElementById('asksTableBody');
  if (bidsBody) {
    bidsBody.innerHTML = orders.length ? orders.map(o => `<tr><td style="color: var(--success); font-weight: 600;">$${Number(o.unitPrice).toFixed(2)}</td><td>${Number(o.quantity).toLocaleString()}</td><td>Company #${o.company_id || '-'}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No active buy orders</td></tr>';
  }
  if (asksBody) {
    asksBody.innerHTML = offers.length ? offers.map(o => `<tr><td style="color: var(--danger); font-weight: 600;">$${Number(o.unitPrice).toFixed(2)}</td><td>${Number(o.quantity).toLocaleString()}</td><td>Company #${o.company_id || '-'}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No active sell offers</td></tr>';
  }
}
