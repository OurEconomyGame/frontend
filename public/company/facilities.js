function renderFacilities(c, isCeo) {
  const facs = (c.data && Array.isArray(c.data.facilities)) ? c.data.facilities : (Array.isArray(c.facilities) ? c.facilities : []);
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;
  if (!facs.length) return tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No facilities owned yet.</td></tr>';
  const rNames = { 0: 'Food', 1: 'Water', 2: 'Grain', 3: 'Electricity', 4: 'Cement', 5: 'Metal', 6: 'RawOre' };
  tbody.innerHTML = facs.map(f => {
    const rec = f.recipe || {}, inList = Object.entries(rec.inputs || {}).filter(([, a]) => Number(a) > 0), inStr = inList.map(([r, a]) => `${a} ${rNames[r] || `R#${r}`}`).join(', ') || 'None';
    const outType = rec.outputType ?? rec.output, outQuant = rec.outputQuant ?? rec.amount ?? 0, outStr = `${outQuant} ${(outType !== undefined && outType !== null) ? (rNames[outType] || `R#${outType}`) : 'None'}`;
    const levelStr = f.level ? `Lv ${f.level}` : (f.efficiency ? `${f.efficiency}x` : 'Active'), sellBtn = isCeo ? `<button class="btn btn-danger btn-sm" onclick="sellFacility('${f.id}')">Sell (10% Refund)</button>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>';
    return `<tr><td><strong>${escapeHtml(f.name || 'Facility')}</strong><br><small style="color: var(--text-muted);">${f.id || ''}</small></td><td>${escapeHtml(rec.name || 'Standard')}</td><td><span style="color: var(--text-muted);">${inStr}</span> &rarr; <strong style="color: var(--success);">${outStr}</strong></td><td><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">${f.active ? 'Active' : 'Inactive'} (${levelStr})</span></td><td>${sellBtn}</td></tr>`;
  }).join('');
}

window.sellFacility = async function(facilityId) {
  const token = getAuthToken();
  if (!token) return showAlert('Please login to sell facilities.', 'danger');
  if (!confirm(`Decommission facility ${facilityId} for a 10% cash refund?`)) return;
  try {
    const res = await fetch(`${BACKEND}/facility/sell`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(companyId), facility_id: facilityId }) });
    const data = await res.json();
    if (data.status === 'Success' || data.status === 'success' || data.refund !== undefined) { showAlert(`Facility decommissioned! Refunded: $${Number(data.refund || 0).toLocaleString()}`, 'success'); loadCompanyDetails(); }
    else showAlert(data.message || data.status || 'Facility sale failed', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
};
