function renderCEODashboard(container, compId, token) {
  container.style.display = 'block';
  container.innerHTML = `
    <div class="card-header"><span class="card-title" style="color: var(--primary);">🛠️ CEO Controls</span></div>
    <div class="grid-3">
      <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem;">Buy Facility</h4>
        <form id="formFacility">
          <div class="form-group"><label>Recipe</label><input type="text" id="facilityRecipe" class="form-control" placeholder="water_pump" required /></div>
          <div class="form-group"><label>Name</label><input type="text" id="facilityName" class="form-control" placeholder="Facility Alpha" /></div>
          <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Buy Facility</button>
        </form>
      </div>
      <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem;">Set Shift Wage</h4>
        <form id="formWage">
          <div class="form-group"><label>Wage ($)</label><input type="number" id="inputWage" class="form-control" min="0" required placeholder="50" /></div>
          <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; margin-top: 18px;">Update Wage</button>
        </form>
      </div>
      <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem;">Dividends</h4>
        <form id="formDividend">
          <div class="form-group"><label>Total ($)</label><input type="number" id="inputDividend" class="form-control" min="1" required placeholder="500" /></div>
          <button type="submit" class="btn btn-success btn-sm" style="width: 100%; margin-top: 18px;">Distribute</button>
        </form>
      </div>
    </div>
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
      const res = await fetch(`${BACKEND}/facility/buy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.facility_id) {
        showAlert(`Purchased facility #${data.facility_id} for $${data.cost}!`, 'success');
        if (typeof loadCompanyDetails === 'function') loadCompanyDetails();
      } else { showAlert(data.message || 'Facility purchase failed', 'danger'); }
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('formWage').addEventListener('submit', async (e) => {
    e.preventDefault();
    const wage = document.getElementById('inputWage').value;
    try {
      const res = await fetch(`${BACKEND}/company/wage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token },
        body: JSON.stringify({ company_id: Number(compId), wage: Number(wage) })
      });
      const data = await res.json();
      if (data.status === 'success' || data.wage !== undefined) {
        showAlert(`Shift wage updated to $${data.wage}!`, 'success');
      } else { showAlert(data.message || 'Wage update failed', 'danger'); }
    } catch (err) { showAlert(err.message, 'danger'); }
  });

  document.getElementById('formDividend').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('inputDividend').value;
    try {
      const res = await fetch(`${BACKEND}/company/dividend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token },
        body: JSON.stringify({ company_id: Number(compId), amount: Number(amount) })
      });
      const data = await res.json();
      if (data.dividend_distributed !== undefined) {
        showAlert(`Distributed $${data.dividend_distributed} to ${data.shareholders_paid} shareholders!`, 'success');
        if (typeof loadCompanyDetails === 'function') loadCompanyDetails();
        if (typeof loadShareholders === 'function') loadShareholders();
      } else { showAlert(data.message || 'Dividend distribution failed', 'danger'); }
    } catch (err) { showAlert(err.message, 'danger'); }
  });
}
