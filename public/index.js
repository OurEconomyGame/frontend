document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  checkStatus();
  loadStats();
});

async function checkStatus() {
  const dot = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');
  try {
    const res = await fetch(`${BACKEND}/version`);
    const data = await res.json();
    dot.className = 'status-dot online';
    text.textContent = `Online (v${data.version || '0.23.0'})`;
  } catch (e) {
    dot.className = 'status-dot offline';
    text.textContent = 'Server Offline';
  }
}

async function loadStats() {
  const statCompanies = document.getElementById('statCompanies');
  const statUsers = document.getElementById('statUsers');
  const recentTable = document.getElementById('recentCompaniesBody');

  try {
    const [compRes, userRes] = await Promise.all([
      fetch(`${BACKEND}/list/companies`).then(r => r.json()).catch(() => []),
      fetch(`${BACKEND}/list/users`).then(r => r.json()).catch(() => [])
    ]);

    if (Array.isArray(compRes)) {
      statCompanies.textContent = compRes.length;
      const typeLabels = { 0: 'Production', 1: 'Holding', 2: 'WebStore' };
      const badgeClasses = { 0: 'badge-production', 1: 'badge-holding', 2: 'badge-store' };

      recentTable.innerHTML = compRes.slice(0, 5).map(c => `
        <tr>
          <td><strong>#${c.id}</strong></td>
          <td>${escapeHtml(c.name)}</td>
          <td><span class="badge ${badgeClasses[c.type] || ''}">${typeLabels[c.type] || 'Unknown'}</span></td>
          <td>${formatCash(c.cash)}</td>
          <td>${c.shares_outstanding || 0}</td>
          <td><a href="/company/?id=${c.id}" class="btn btn-secondary btn-sm">Details</a></td>
        </tr>
      `).join('');
    }

    if (Array.isArray(userRes)) {
      statUsers.textContent = userRes.length;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}
