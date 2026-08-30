const BACKEND = 'https://server-oureconomy.napp9.com';

document.getElementById('embedSignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  const user = document.getElementById('username').value.trim();
  const secret = document.getElementById('password').value.trim();

  alertBox.className = 'alert';
  alertBox.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hi: user, secret: secret })
    });
    const data = await res.json();

    if (data.random) {
      localStorage.setItem('oe_token', data.random);
      localStorage.setItem('oe_username', user);
      if (data.id) localStorage.setItem('oe_user_id', data.id);
      
      alertBox.className = 'alert alert-success visible';
      alertBox.textContent = `Account created! Welcome, citizen #${data.id || ''}.`;
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'OE_SIGNUP_SUCCESS',
          token: data.random,
          username: user,
          userId: data.id
        }, '*');
      }
    } else {
      alertBox.className = 'alert alert-danger visible';
      alertBox.textContent = data.message || data.status || 'Signup failed';
    }
  } catch (err) {
    alertBox.className = 'alert alert-danger visible';
    alertBox.textContent = err.message || 'Connection error';
  }
});
