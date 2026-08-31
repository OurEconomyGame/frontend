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

const _userProfileCache = {};
async function getUserProfile(userId) {
  if (userId === null || userId === undefined) return null;
  const idNum = Number(userId);
  if (_userProfileCache[idNum]) return _userProfileCache[idNum];

  try {
    const res = await fetch(`${BACKEND}/user?id=${idNum}`);
    const data = await res.json();
    if (data.user && data.user.username) {
      _userProfileCache[idNum] = data.user;
      return data.user;
    }
  } catch (e) {}

  const fallback = { id: idNum, username: `Citizen #${idNum}` };
  _userProfileCache[idNum] = fallback;
  return fallback;
}

async function renderUserLink(userId) {
  if (userId === null || userId === undefined) return '<span style="color: var(--text-muted);">None</span>';
  const u = await getUserProfile(userId);
  const name = escapeHtml(u.username || `Citizen #${userId}`);
  const joinedStr = u.joined ? new Date(u.joined * 1000).toLocaleDateString() : '';
  const tooltip = `Citizen #${u.id}${joinedStr ? ` • Joined: ${joinedStr}` : ''}`;
  return `<a href="/portfolio/?user=${u.id}" class="user-link" title="${tooltip}" style="color: var(--primary); font-weight: 600;">${name}</a>`;
}

let _usersCache = null;
async function getUserMap() {
  if (_usersCache) return _usersCache;
  const map = {};
  const loggedName = localStorage.getItem('oe_username'), loggedUid = localStorage.getItem('oe_user_id');
  if (loggedUid !== null && loggedName) map[Number(loggedUid)] = loggedName;

  try {
    const res = await fetch(`${BACKEND}/list/users`);
    const users = await res.json();
    if (Array.isArray(users)) users.forEach(u => { map[u.id] = u.username; _userProfileCache[u.id] = u; });
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
