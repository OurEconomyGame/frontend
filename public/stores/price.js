function setupPriceForm() {
  const form = document.getElementById('storePriceForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return showAlert('You must be logged in as CEO to update store prices.', 'danger');

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
