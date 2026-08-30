let pollingInterval = null;
let isPollingActive = true;

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => {
    if (isPollingActive) {
      fetchAllCommodities();
    }
  }, 3000);
}

function togglePolling() {
  isPollingActive = !isPollingActive;
  const btn = document.getElementById('btnTogglePolling');
  const dot = document.getElementById('pollingDot');
  const status = document.getElementById('pollingStatus');

  if (isPollingActive) {
    btn.textContent = 'Pause Feed';
    dot.className = 'status-dot online';
    status.textContent = 'Active (3s)';
    fetchAllCommodities();
  } else {
    btn.textContent = 'Resume Feed';
    dot.className = 'status-dot offline';
    status.textContent = 'Paused';
  }
}

async function fetchAllCommodities() {
  const summaryBody = document.getElementById('commoditiesSummaryBody');
  if (!summaryBody) return;

  try {
    const promises = RESOURCES.map(r =>
      fetch(`${BACKEND}/market/depth?resource=${r.id}`)
        .then(res => res.json())
        .catch(err => ({ error: true, resource: r.id, message: err.message }))
    );

    const dataList = await Promise.all(promises);

    summaryBody.innerHTML = dataList.map((data, index) => {
      const resource = RESOURCES[index];
      const orders = data.orders || [];
      const offers = data.offers || [];

      const bestBid = orders.length > 0 ? Number(orders[0].unitPrice) : null;
      const bestAsk = offers.length > 0 ? Number(offers[0].unitPrice) : null;
      const spread = (bestBid !== null && bestAsk !== null) ? `$${(bestAsk - bestBid).toFixed(2)}` : '—';

      const totalBidQty = orders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
      const totalAskQty = offers.reduce((sum, o) => sum + Number(o.quantity || 0), 0);

      if (resource.id === selectedResourceId && typeof renderDetailedDepth === 'function') {
        renderDetailedDepth(orders, offers);
      }

      return `
        <tr>
          <td><strong>${resource.name}</strong></td>
          <td style="color: var(--success); font-weight: 600;">${bestBid !== null ? `$${bestBid.toFixed(2)}` : '—'}</td>
          <td style="color: var(--danger); font-weight: 600;">${bestAsk !== null ? `$${bestAsk.toFixed(2)}` : '—'}</td>
          <td>${spread}</td>
          <td>${totalBidQty.toLocaleString()}</td>
          <td>${totalAskQty.toLocaleString()}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="selectDepthResource(${resource.id})">Inspect Depth</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Periodic market fetch error:', err);
  }
}
