function renderCEODashboard(container, compId, token, c) {
  container.style.display = 'block';
  const isProd = Number(c?.type) === 0;
  const recipeOpts = (typeof RECIPES !== 'undefined' ? RECIPES : [
    { id: 'water_pump', name: 'Water Pump ($200 • Output: 500 Water)' }, { id: 'manual_grain_farm', name: 'Manual Grain Farm ($500 • 300 Water → 150 Grain)' },
    { id: 'geothermal_plant', name: 'Geothermal Plant ($500 • 100 Water → 200 Electricity)' }, { id: 'electric_water_pump', name: 'Electric Water Pump ($2,000 • 200 Electricity → 3,000 Water)' },
    { id: 'pre_packaged_food', name: 'Pre Packaged Food ($2,000 • Elec + Water + Grain → 25 Food)' }
  ]).map(r => `<option value="${r.id}">${r.name}</option>`).join('');

  const logs = (c && c.data && Array.isArray(c.data.logs)) ? c.data.logs : [];
  const logRows = logs.length ? logs.slice().reverse().map(([t, ts]) => `<tr><td style="white-space: nowrap; color: var(--text-muted); font-size: 0.8rem;">${ts ? new Date(ts * 1000).toLocaleString() : ''}</td><td style="font-size: 0.85rem;">${escapeHtml(t)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">No activity logged yet.</td></tr>';

  const prodControls = isProd ? `
    <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md);">
      <h4 style="margin-bottom: 8px; font-size: 0.85rem;">Buy Facility</h4>
      <form id="formFacility"><div class="form-group" style="margin-bottom: 8px;"><label>Recipe</label><select id="facilityRecipe" class="form-control" required>${recipeOpts}</select></div><div class="form-group" style="margin-bottom: 8px;"><label>Name (Optional)</label><input type="text" id="facilityName" class="form-control" placeholder="Facility Alpha" /></div><button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Buy Facility</button></form>
    </div>` : '';

  const wageForm = isProd ? `<form id="formWage" style="margin-bottom: 8px;"><div class="form-group" style="margin-bottom: 6px;"><label>Shift Wage ($)</label><input type="number" id="inputWage" class="form-control" min="0" required placeholder="50" /></div><button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Update Wage</button></form>` : '';

  container.innerHTML = `
    <div class="card-header"><span class="card-title" style="color: var(--primary);">🛠️ CEO Controls &amp; Activity</span></div>
    <div class="${isProd ? 'grid-2' : ''}" style="margin-bottom: 16px;">
      ${prodControls}
      <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 8px; font-size: 0.85rem;">${isProd ? 'Wage &amp; ' : ''}Dividends</h4>
        ${wageForm}
        <form id="formDividend"><div class="form-group" style="margin-bottom: 6px;"><label>Dividend Total ($)</label><input type="number" id="inputDividend" class="form-control" min="1" required placeholder="500" /></div><button type="submit" class="btn btn-success btn-sm" style="width: 100%;">Distribute Dividends</button></form>
      </div>
    </div>
    <div class="card" style="border: 1px solid var(--border-color); margin-bottom: 16px;"><div class="card-header"><span class="card-title">📜 Company Transaction &amp; Event Logs</span></div><div class="table-responsive" style="max-height: 220px; overflow-y: auto;"><table><thead><tr><th style="width: 170px;">Timestamp</th><th>Event</th></tr></thead><tbody>${logRows}</tbody></table></div></div>
    <div style="text-align: right;"><button id="btnDeleteCompany" class="btn btn-danger btn-sm">⚠️ Dissolve &amp; Delete Company</button></div>
  `;
  attachCEOListeners(compId, token, isProd);
}

function attachCEOListeners(compId, token, isProd) {
  if (isProd) {
    document.getElementById('formFacility')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recipe = document.getElementById('facilityRecipe').value.trim(), name = document.getElementById('facilityName').value.trim();
      try {
        const body = { company_id: Number(compId), recipe };
        if (name) body.name = name;
        const res = await fetch(`${BACKEND}/facility/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.facility_id) { showAlert(`Purchased facility #${data.facility_id} for $${data.cost}!`, 'success'); if (typeof loadCompanyDetails === 'function') loadCompanyDetails(); }
        else showAlert(data.message || 'Facility purchase failed', 'danger');
      } catch (err) { showAlert(err.message, 'danger'); }
    });

    document.getElementById('formWage')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const wage = document.getElementById('inputWage').value;
      try {
        const res = await fetch(`${BACKEND}/company/wage`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId), wage: Number(wage) }) });
        const data = await res.json();
        if (data.status === 'success' || data.wage !== undefined) showAlert(`Shift wage updated to $${data.wage}!`, 'success');
        else showAlert(data.message || 'Wage update failed', 'danger');
      } catch (err) { showAlert(err.message, 'danger'); }
    });
  }

  document.getElementById('formDividend').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('inputDividend').value;
    try {
      const res = await fetch(`${BACKEND}/company/dividend`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId), amount: Number(amount) }) });
      const data = await res.json();
      if (data.dividend_distributed !== undefined) { showAlert(`Distributed $${data.dividend_distributed} to ${data.shareholders_paid} shareholders!`, 'success'); if (typeof loadCompanyDetails === 'function') loadCompanyDetails(); if (typeof loadShareholders === 'function') loadShareholders(); }
      else showAlert(data.message || 'Dividend distribution failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('btnDeleteCompany').addEventListener('click', async () => {
    if (!confirm('Permanently dissolve and delete this company? All facilities and shares will be liquidated.')) return;
    try {
      const res = await fetch(`${BACKEND}/company/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId) }) });
      const data = await res.json();
      if (data.status === 'success' || data.deleted_company_id) { alert('Company dissolved.'); window.location.href = '/companies/'; }
      else showAlert(data.message || 'Company deletion failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}
