document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox'), user = document.getElementById('username').value.trim(), secret = document.getElementById('password').value.trim();
  alertBox.className = 'alert'; alertBox.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hi: user, secret })
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem('oe_token', data.token);
      localStorage.setItem('oe_username', user);
      const uid = data.id ?? data.user_id ?? data.user?.id;
      if (uid !== undefined) localStorage.setItem('oe_user_id', uid);
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
