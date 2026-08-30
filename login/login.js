const BACKEND = 'http://localhost:3001';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  const user = document.getElementById('username').value.trim();
  const secret = document.getElementById('password').value.trim();

  alertBox.className = 'alert';
  alertBox.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hi: user, secret: secret })
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem('oe_token', data.token);
      localStorage.setItem('oe_username', user);
      alertBox.className = 'alert alert-success visible';
      alertBox.textContent = 'Login successful! Redirecting...';
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } else {
      alertBox.className = 'alert alert-danger visible';
      alertBox.textContent = data.message || data.status || 'Invalid credentials';
    }
  } catch (err) {
    alertBox.className = 'alert alert-danger visible';
    alertBox.textContent = err.message || 'Connection error';
  }
});
