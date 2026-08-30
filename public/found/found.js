const BACKEND = 'https://oureconomy.server.napp9.com:443';

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  setupFoundForm();
});

function renderAuthNav() {
  const token = localStorage.getItem('oe_token');
  const user = localStorage.getItem('oe_username');
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (token) {
    navAuth.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">👤 ${user || 'Citizen'}</span>
      <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      localStorage.removeItem('oe_token');
      localStorage.removeItem('oe_username');
      window.location.reload();
    });
  }
}

function setupFoundForm() {
  const form = document.getElementById('foundForm');
  const alertBox = document.getElementById('alertBox');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('oe_token');
    alertBox.className = 'alert';

    if (!token) {
      alertBox.className = 'alert alert-danger visible';
      alertBox.textContent = 'You must be logged in to found a company.';
      return;
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
        alertBox.className = 'alert alert-success visible';
        alertBox.textContent = `Company "${name}" founded successfully (ID #${data.id})! Redirecting...`;
        setTimeout(() => {
          window.location.href = `/company/?id=${data.id}`;
        }, 1200);
      } else {
        alertBox.className = 'alert alert-danger visible';
        alertBox.textContent = data.message || data.status || 'Failed to found company';
      }
    } catch (err) {
      alertBox.className = 'alert alert-danger visible';
      alertBox.textContent = err.message || 'Connection error';
    }
  });
}
