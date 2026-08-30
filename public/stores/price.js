async function setupPriceForm() {
  const form = document.getElementById('storePriceForm'), storeSelect = document.getElementById('priceStoreId');
  if (!form) return;

  const token = getAuthToken();
  if (token && storeSelect) {
    try {
      const res = await fetch(`${BACKEND}/company/ceo`, { headers: { 'Auth': token } });
      const data = await res.json(), stores = (data.companies || []).filter(c => c.type === 2);
      storeSelect.innerHTML = stores.length ? stores.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (#${s.id})</option>`).join('') : '<option value="">No WebStores owned</option>';
    } catch (e) {}
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) return showAlert('Please log in as CEO to update store prices.', 'danger');
    const compId = Number(storeSelect.value), price = Number(document.getElementById('priceStoreValue').value);
    if (!compId) return showAlert('Please select a WebStore.', 'danger');

    try {
      const res = await fetch(`${BACKEND}/store/price`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: compId, price }) });
      const data = await res.json();
      if (data.status === 'success' || data.price !== undefined) showAlert(`Store price updated to $${data.price}!`, 'success');
      else showAlert(data.message || 'Price update failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}
