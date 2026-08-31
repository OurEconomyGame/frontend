window.workShift = async function(companyId) {
  const token = getAuthToken();
  if (!token) return showAlert('You must be logged in to work a shift.', 'danger');

  try {
    const res = await fetch(`${BACKEND}/company/work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth': token },
      body: JSON.stringify({ company_id: companyId })
    });
    const data = await res.json();

    if (data.status === 'success' || data.wage_paid !== undefined) {
      showAlert(`Shift completed! Earned wage: $${data.wage_paid || 0}. Remaining treasury: $${data.company_cash || 0}`, 'success');
      if (typeof loadCompanies === 'function') loadCompanies();
    } else {
      const errMsg = data.error || data.message || (data.status && !data.status.toLowerCase().includes('iff') ? data.status : '') || 'Work shift failed';
      showAlert(errMsg, 'danger');
    }
  } catch (err) { showAlert(err.message || 'Error working shift', 'danger'); }
};
