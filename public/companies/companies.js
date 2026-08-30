document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  loadCompanies();
  document.getElementById('sortSelect').addEventListener('change', loadCompanies);
  document.getElementById('typeSelect').addEventListener('change', loadCompanies);
});

async function loadCompanies() {
  const tbody = document.getElementById('companiesTableBody');
  const sortBy = document.getElementById('sortSelect').value;
  const type = document.getElementById('typeSelect').value;
  const token = getAuthToken();

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading companies...</td></tr>';

  let url = `${BACKEND}/list/companies?sortBy=${sortBy}`;
  if (type !== '') url += `&type=${type}`;

  const headers = {};
  if (token) headers['Auth'] = token;

  try {
    const [res, userMap] = await Promise.all([
      fetch(url, { headers }),
      getUserMap()
    ]);
    const companies = await res.json();

    if (!Array.isArray(companies) || companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No companies found</td></tr>';
      return;
    }

    const typeLabels = { 0: 'Production', 1: 'Holding', 2: 'WebStore' };
    const badgeClasses = { 0: 'badge-production', 1: 'badge-holding', 2: 'badge-store' };

    tbody.innerHTML = companies.map(c => {
      const ceoLabel = (c.ceo !== null && c.ceo !== undefined)
        ? `<a href="/portfolio/?user=${c.ceo}" style="color: var(--primary); font-weight: 600;">${escapeHtml(userMap[c.ceo] || `Citizen #${c.ceo}`)}</a>`
        : '<span style="color: var(--text-muted);">None</span>';
      return `
        <tr>
          <td><strong>#${c.id}</strong></td>
          <td>${escapeHtml(c.name)}</td>
          <td><span class="badge ${badgeClasses[c.type] || ''}">${typeLabels[c.type] || 'Unknown'}</span></td>
          <td>${formatCash(c.cash)}</td>
          <td>${c.shares_outstanding || 0}</td>
          <td>${ceoLabel}</td>
          <td>
            <a href="/company/?id=${c.id}" class="btn btn-secondary btn-sm">Details</a>
            <button class="btn btn-primary btn-sm" onclick="workShift(${c.id})">Work Shift</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}
