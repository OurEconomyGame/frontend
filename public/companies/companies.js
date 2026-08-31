document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadCompanies();
  document.getElementById('sortSelect').addEventListener('change', loadCompanies);
  document.getElementById('typeSelect').addEventListener('change', loadCompanies);
});

async function loadCompanies() {
  const tbody = document.getElementById('companiesTableBody'), sortBy = document.getElementById('sortSelect').value, type = document.getElementById('typeSelect').value, token = getAuthToken();
  tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">Loading companies...</td></tr>';

  let url = `${BACKEND}/list/companies`;
  if (type !== '') url += `?type=${type}`;

  try {
    const [res, compMap] = await Promise.all([fetch(url, { headers: token ? { 'Auth': token } : {} }), getCompanyMap()]);
    const companies = await res.json();
    if (!Array.isArray(companies) || !companies.length) return tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No companies found</td></tr>';

    if (sortBy === 'wage_desc') companies.sort((a, b) => ((b.type === 0 ? (b.wage ?? 10) : 0) - (a.type === 0 ? (a.wage ?? 10) : 0)));
    else if (sortBy === 'wage_asc') companies.sort((a, b) => ((a.type === 0 ? (a.wage ?? 10) : 0) - (b.type === 0 ? (b.wage ?? 10) : 0)));
    else if (sortBy === 'cash') companies.sort((a, b) => (b.cash ?? 0) - (a.cash ?? 0));
    else if (sortBy === 'name') companies.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else companies.sort((a, b) => a.id - b.id);

    const typeLabels = { 0: 'Production', 1: 'Holding', 2: 'WebStore' }, badgeClasses = { 0: 'badge-production', 1: 'badge-holding', 2: 'badge-store' };
    const rows = await Promise.all(companies.map(async (c) => {
      const isProd = Number(c.type) === 0, ceoLabel = await renderUserLink(c.ceo), founderLabel = await renderUserLink(c.founder_id ?? c.founder);
      let ownerLabel = '<span style="color: var(--text-muted);">None</span>';
      if (Array.isArray(c.shareholders) && c.shareholders.length > 0) {
        const top = c.shareholders[0];
        const topName = top.owner_user ? await renderUserLink(top.owner_id) : `<a href="/company/?id=${top.owner_id}" style="color: var(--accent); font-weight: 600;">${escapeHtml(compMap[top.owner_id] || `Company #${top.owner_id}`)}</a>`;
        ownerLabel = `${topName} <small style="color: var(--text-muted);">(${top.percentage}%)</small>`;
      }
      const wageCol = isProd ? `<strong style="color: var(--success);">$${Number(c.wage ?? 10).toLocaleString()}</strong>` : '<span style="color: var(--text-muted);">—</span>';
      const workBtn = isProd ? `<button class="btn btn-primary btn-sm" onclick="workShift(${c.id})">Work ($${Number(c.wage ?? 10)})</button>` : '';
      return `<tr><td><strong>#${c.id}</strong></td><td>${escapeHtml(c.name)}</td><td><span class="badge ${badgeClasses[c.type] || ''}">${typeLabels[c.type] || 'Unknown'}</span></td><td>${formatCash(c.cash)}</td><td>${wageCol}</td><td>${c.shares_outstanding || 0}</td><td>${ceoLabel}</td><td>${founderLabel}</td><td>${ownerLabel}</td><td><a href="/company/?id=${c.id}" class="btn btn-secondary btn-sm">Details</a> ${workBtn}</td></tr>`;
    }));
    tbody.innerHTML = rows.join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}
