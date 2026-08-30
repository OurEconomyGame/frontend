window.workShift = async function(companyId) {
  const token = getAuthToken();
  if (!token) {
    showAlert('You must be logged in to work a shift.', 'danger');
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/company/work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': token
      },
      body: JSON.stringify({ company_id: companyId })
    });
    const data = await res.json();

    if (data.status === 'success' || data.wage_paid !== undefined) {
      showAlert(`Shift completed! Earned wage: $${data.wage_paid || 0}. Remaining treasury: $${data.company_cash || 0}`, 'success');
      if (typeof loadCompanies === 'function') loadCompanies();
    } else {
      showAlert(data.message || data.status || 'Work shift failed', 'danger');
    }
  } catch (err) {
    showAlert(err.message || 'Error working shift', 'danger');
  }
};
