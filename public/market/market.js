document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  initTradeDropdowns();
  fetchAllCommodities();
  startPolling();

  document.getElementById('btnTogglePolling').addEventListener('click', togglePolling);
  document.getElementById('selectedResourceDropdown').addEventListener('change', (e) => {
    selectDepthResource(Number(e.target.value));
  });

  document.getElementById('tradeCompId').addEventListener('change', syncTradeQuantity);
  document.getElementById('tradeResource').addEventListener('change', syncTradeQuantity);

  document.getElementById('btnMarketBuy').addEventListener('click', () => executeTrade('buy'));
  document.getElementById('btnMarketSell').addEventListener('click', () => executeTrade('sell'));
  document.getElementById('cancelForm').addEventListener('submit', cancelTradeOrder);
});
