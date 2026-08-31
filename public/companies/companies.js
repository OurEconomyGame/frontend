document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadCompanies();
  document.getElementById('sortSelect').addEventListener('change', loadCompanies);
  document.getElementById('typeSelect').addEventListener('change', loadCompanies);
});

async function loadCompanies() {
  const tbody = document.getElementById('companiesTableBody'), sortBy = document.getElementById('sortSelect').value, type = document.getElementById('typeSelect').value, token = getAuthToken();
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading companies...</td></tr>';

  let url = `${BACKEND}/list/companies?sortBy=${sortBy}`;
  if (type !== '') url += `&type=${type}`;

  try {
    const res = await fetch(url, { headers: token ? { 'Auth': token } : {} });
    const companies = await res.json();
    if (!Array.isArray(companies) || !companies.length) return tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No companies found</td></tr>';

    const typeLabels = { 0: 'Production', 1: 'Holding', 2: 'WebStore' }, badgeClasses = { 0: 'badge-production', 1: 'badge-holding', 2: 'badge-store' };
    const rows = await Promise.all(companies.map(async (c) => {
      const ceoLabel = await renderUserLink(c.ceo);
      return `<tr><td><strong>#${c.id}</strong></td><td>${escapeHtml(c.name)}</td><td><span class="badge ${badgeClasses[c.type] || ''}">${typeLabels[c.type] || 'Unknown'}</span></td><td>${formatCash(c.cash)}</td><td>${c.shares_outstanding || 0}</td><td>${ceoLabel}</td><td><a href="/company/?id=${c.id}" class="btn btn-secondary btn-sm">Details</a> <button class="btn btn-primary btn-sm" onclick="workShift(${c.id})">Work Shift</button></td></tr>`;
    }));
    tbody.innerHTML = rows.join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}
