document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  setupFoundForm();
});

function setupFoundForm() {
  const form = document.getElementById('foundForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getAuthToken();

    if (!token) {
      return showAlert('You must be logged in to found a company.', 'danger');
    }

    const name = document.getElementById('companyName').value.trim();
    const type = Number(document.getElementById('companyType').value);

    try {
      const res = await fetch(`${BACKEND}/found`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': token
        },
        body: JSON.stringify({ name, type })
      });
      const data = await res.json();

      if (data.id) {
        showAlert(`Company "${name}" founded successfully (ID #${data.id})! Redirecting...`, 'success');
        setTimeout(() => {
          window.location.href = `/company/?id=${data.id}`;
        }, 1200);
      } else {
        showAlert(data.message || data.status || 'Failed to found company', 'danger');
      }
    } catch (err) {
      showAlert(err.message || 'Connection error', 'danger');
    }
  });
}
