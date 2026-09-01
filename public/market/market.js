document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  initTradeDropdowns();
  fetchAllCommodities();
  startPolling();

  document.getElementById('btnTogglePolling')?.addEventListener('click', togglePolling);
  document.getElementById('selectedResourceDropdown')?.addEventListener('change', (e) => {
    selectDepthResource(Number(e.target.value));
  });

  document.getElementById('tradeCompId')?.addEventListener('change', (e) => {
    const cancelSelect = document.getElementById('cancelCompId');
    if (cancelSelect) cancelSelect.value = e.target.value;
    syncTradeQuantity();
    if (typeof updateCancelDropdown === 'function') updateCancelDropdown();
  });
  document.getElementById('tradeResource')?.addEventListener('change', syncTradeQuantity);

  document.getElementById('cancelCompId')?.addEventListener('change', (e) => {
    const tradeSelect = document.getElementById('tradeCompId');
    if (tradeSelect) tradeSelect.value = e.target.value;
    syncTradeQuantity();
    if (typeof updateCancelDropdown === 'function') updateCancelDropdown();
  });

  document.getElementById('btnMarketBuy')?.addEventListener('click', () => executeTrade('buy'));
  document.getElementById('btnMarketSell')?.addEventListener('click', () => executeTrade('sell'));
  document.getElementById('cancelForm')?.addEventListener('submit', cancelTradeOrder);
});
