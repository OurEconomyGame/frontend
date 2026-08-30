function showAlert(msg, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  alertBox.className = `alert alert-${type} visible`;
  alertBox.textContent = msg;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatCash(num) {
  return `$${Number(num || 0).toLocaleString()}`;
}

let _usersCache = null;
async function getUserMap() {
  if (_usersCache) return _usersCache;
  const loggedName = localStorage.getItem('oe_username');
  const loggedUid = localStorage.getItem('oe_user_id');
  const map = { 0: (loggedUid === '0' && loggedName) ? loggedName : 'xillion' };
  try {
    const res = await fetch(`${BACKEND}/list/users`);
    const users = await res.json();
    if (Array.isArray(users)) users.forEach(u => { map[u.id] = u.username; });
  } catch (e) {}
  _usersCache = map;
  return map;
}

let _companiesCache = null;
async function getCompanyMap() {
  if (_companiesCache) return _companiesCache;
  const map = {};
  try {
    const res = await fetch(`${BACKEND}/list/companies`);
    const comps = await res.json();
    if (Array.isArray(comps)) comps.forEach(c => { map[c.id] = c.name; });
  } catch (e) {}
  _companiesCache = map;
  return map;
}
