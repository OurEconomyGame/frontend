function renderCEODashboard(container, compId, token) {
  container.style.display = 'block';
  const recipeOpts = (typeof RECIPES !== 'undefined' ? RECIPES : [
    { id: 'water_pump', name: 'Water Pump ($200 • Output: 500 Water)' },
    { id: 'manual_grain_farm', name: 'Manual Grain Farm ($500 • 300 Water → 150 Grain)' },
    { id: 'geothermal_plant', name: 'Geothermal Plant ($500 • 100 Water → 200 Electricity)' },
    { id: 'electric_water_pump', name: 'Electric Water Pump ($2,000 • 200 Electricity → 3,000 Water)' },
    { id: 'pre_packaged_food', name: 'Pre Packaged Food ($2,000 • Elec + Water + Grain → 25 Food)' }
  ]).map(r => `<option value="${r.id}">${r.name}</option>`).join('');

  container.innerHTML = `
    <div class="card-header"><span class="card-title" style="color: var(--primary);">🛠️ CEO Controls</span></div>
    <div class="grid-2" style="margin-bottom: 16px;">
      <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 8px; font-size: 0.85rem;">Buy Facility</h4>
        <form id="formFacility">
          <div class="form-group" style="margin-bottom: 8px;"><label>Production Recipe</label><select id="facilityRecipe" class="form-control" required>${recipeOpts}</select></div>
          <div class="form-group" style="margin-bottom: 8px;"><label>Name (Optional)</label><input type="text" id="facilityName" class="form-control" placeholder="Facility Alpha" /></div>
          <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Buy Facility</button>
        </form>
      </div>
      <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 8px; font-size: 0.85rem;">Wage & Dividends</h4>
        <form id="formWage" style="margin-bottom: 8px;"><div class="form-group" style="margin-bottom: 6px;"><label>Shift Wage ($)</label><input type="number" id="inputWage" class="form-control" min="0" required placeholder="50" /></div><button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Update Wage</button></form>
        <form id="formDividend"><div class="form-group" style="margin-bottom: 6px;"><label>Dividend Total ($)</label><input type="number" id="inputDividend" class="form-control" min="1" required placeholder="500" /></div><button type="submit" class="btn btn-success btn-sm" style="width: 100%;">Distribute</button></form>
      </div>
    </div>
    <div style="text-align: right;"><button id="btnDeleteCompany" class="btn btn-danger btn-sm">⚠️ Dissolve & Delete Company</button></div>
  `;
  attachCEOListeners(compId, token);
}

function attachCEOListeners(compId, token) {
  document.getElementById('formFacility').addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipe = document.getElementById('facilityRecipe').value.trim();
    const name = document.getElementById('facilityName').value.trim();
    try {
      const body = { company_id: Number(compId), recipe };
      if (name) body.name = name;
      const res = await fetch(`${BACKEND}/facility/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.facility_id) {
        showAlert(`Purchased facility #${data.facility_id} for $${data.cost}!`, 'success');
        if (typeof loadCompanyDetails === 'function') loadCompanyDetails();
      } else showAlert(data.message || 'Facility purchase failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('formWage').addEventListener('submit', async (e) => {
    e.preventDefault();
    const wage = document.getElementById('inputWage').value;
    try {
      const res = await fetch(`${BACKEND}/company/wage`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId), wage: Number(wage) }) });
      const data = await res.json();
      if (data.status === 'success' || data.wage !== undefined) showAlert(`Shift wage updated to $${data.wage}!`, 'success');
      else showAlert(data.message || 'Wage update failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('formDividend').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('inputDividend').value;
    try {
      const res = await fetch(`${BACKEND}/company/dividend`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId), amount: Number(amount) }) });
      const data = await res.json();
      if (data.dividend_distributed !== undefined) {
        showAlert(`Distributed $${data.dividend_distributed} to ${data.shareholders_paid} shareholders!`, 'success');
        if (typeof loadCompanyDetails === 'function') loadCompanyDetails();
        if (typeof loadShareholders === 'function') loadShareholders();
      } else showAlert(data.message || 'Dividend distribution failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('btnDeleteCompany').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to permanently dissolve and delete this company? All facilities and shares will be liquidated.')) return;
    try {
      const res = await fetch(`${BACKEND}/company/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ company_id: Number(compId) }) });
      const data = await res.json();
      if (data.status === 'success' || data.deleted_company_id) {
        alert('Company dissolved successfully.');
        window.location.href = '/companies/';
      } else showAlert(data.message || 'Company deletion failed', 'danger');
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}
