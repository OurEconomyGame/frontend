/**
 * OurEconomy Main Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAuth();
  initModals();
  checkServerStatus();
  loadDashboardData();
  setupEventListeners();
});

// Navigation state
function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-item button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');

  const titles = {
    'dashboard': { title: 'Dashboard', sub: 'Overview of economy stats and personal assets' },
    'companies': { title: 'Companies', sub: 'Explore, found, and manage commercial entities' },
    'market': { title: 'Marketplace', sub: 'Commodity exchange orderbook and trading' },
    'stores': { title: 'WebStores', sub: 'Retail food markets and simulation ticks' },
    'portfolio': { title: 'Portfolio & Cap Tables', sub: 'View shareholdings and company equity' },
    'users': { title: 'User Directory', sub: 'Public citizen registry' }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (!tabId) return;

      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      btn.parentElement.classList.add('active');

      tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      if (titles[tabId]) {
        pageTitle.textContent = titles[tabId].title;
        pageSubtitle.textContent = titles[tabId].sub;
      }

      // Load view data
      if (tabId === 'companies') loadCompanies();
      if (tabId === 'market') loadMarketDepth();
      if (tabId === 'stores') loadStores();
      if (tabId === 'portfolio') loadPortfolio();
      if (tabId === 'users') loadUsers();
    });
  });
}

// Authentication handling
function initAuth() {
  updateUserUI();

  const loginBtn = document.getElementById('btnLoginModal');
  const signupBtn = document.getElementById('btnSignupModal');
  const logoutBtn = document.getElementById('btnLogout');

  if (loginBtn) loginBtn.addEventListener('click', () => openModal('modalLogin'));
  if (signupBtn) signupBtn.addEventListener('click', () => openModal('modalSignup'));
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.setAuth(null);
      updateUserUI();
      showToast('Logged out successfully', 'info');
      loadDashboardData();
    });
  }

  // Handle Login form
  const loginForm = document.getElementById('formLogin');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('loginUser').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      try {
        const res = await API.login(user, pass);
        if (res.token) {
          API.setAuth(res.token, user);
          closeAllModals();
          updateUserUI();
          showToast(`Welcome back, ${user}!`, 'success');
          loadDashboardData();
        } else {
          showToast(res.status || 'Login failed', 'danger');
        }
      } catch (err) {
        showToast(err.message || 'Login error', 'danger');
      }
    });
  }

  // Handle Signup form
  const signupForm = document.getElementById('formSignup');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('signupUser').value.trim();
      const pass = document.getElementById('signupPass').value.trim();
      try {
        const res = await API.signup(user, pass);
        if (res.random) {
          API.setAuth(res.random, user, res.id);
          closeAllModals();
          updateUserUI();
          showToast(`Account created! Welcome, ${user}`, 'success');
          loadDashboardData();
        } else {
          showToast(res.status || 'Signup failed', 'danger');
        }
      } catch (err) {
        showToast(err.message || 'Signup error', 'danger');
      }
    });
  }
}

function updateUserUI() {
  const user = API.getCurrentUser();
  const guestBox = document.getElementById('guestControls');
  const userBox = document.getElementById('authenticatedControls');
  const userNameDisplay = document.getElementById('currentUsername');
  const userInitial = document.getElementById('userAvatarInitial');

  if (user) {
    if (guestBox) guestBox.style.display = 'none';
    if (userBox) userBox.style.display = 'flex';
    if (userNameDisplay) userNameDisplay.textContent = user.username;
    if (userInitial) userInitial.textContent = user.username.charAt(0).toUpperCase();
  } else {
    if (guestBox) guestBox.style.display = 'flex';
    if (userBox) userBox.style.display = 'none';
  }
}

// Server Health Check
async function checkServerStatus() {
  const dot = document.getElementById('serverStatusDot');
  const text = document.getElementById('serverStatusText');
  const versionBadge = document.getElementById('appVersionBadge');

  try {
    const res = await API.getVersion();
    if (dot) dot.className = 'status-dot online';
    if (text) text.textContent = `Online (v${res.version || '0.20.0'})`;
    if (versionBadge) versionBadge.textContent = `v${res.version || '0.20.0'}`;
  } catch (err) {
    if (dot) dot.className = 'status-dot offline';
    if (text) text.textContent = 'Server Offline';
  }
}

// Data loaders
async function loadDashboardData() {
  try {
    const companies = await API.listCompanies().catch(() => []);
    const users = await API.listUsers().catch(() => []);

    const countCompanies = document.getElementById('statTotalCompanies');
    const countUsers = document.getElementById('statTotalUsers');

    if (countCompanies) countCompanies.textContent = Array.isArray(companies) ? companies.length : 0;
    if (countUsers) countUsers.textContent = Array.isArray(users) ? users.length : 0;
  } catch (e) {
    console.warn('Could not load dashboard stats:', e);
  }
}

async function loadCompanies() {
  const tableBody = document.getElementById('companiesTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Loading companies...</td></tr>';

  try {
    const companies = await API.listCompanies();
    if (!Array.isArray(companies) || companies.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No companies found</td></tr>';
      return;
    }

    const typeLabels = { 0: { name: 'Production', class: 'badge-production' }, 1: { name: 'Holding', class: 'badge-holding' }, 2: { name: 'WebStore', class: 'badge-store' } };

    tableBody.innerHTML = companies.map(c => {
      const typeInfo = typeLabels[c.type] || { name: 'Unknown', class: '' };
      return `
        <tr>
          <td><strong>#${c.id}</strong></td>
          <td>${escapeHtml(c.name)}</td>
          <td><span class="badge ${typeInfo.class}">${typeInfo.name}</span></td>
          <td>$${Number(c.cash || 0).toLocaleString()}</td>
          <td>${c.shares_outstanding || 0}</td>
          <td>${c.ceo ? `User #${c.ceo}` : 'None'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="showCompanyDetails(${c.id})">Details</button>
            <button class="btn btn-primary btn-sm" onclick="workAtCompany(${c.id})">Work Shift</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function loadMarketDepth() {
  const resSelect = document.getElementById('marketResourceSelect');
  const resId = resSelect ? resSelect.value : 0;
  const bidsBody = document.getElementById('marketBidsBody');
  const asksBody = document.getElementById('marketAsksBody');

  if (bidsBody) bidsBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Loading bids...</td></tr>';
  if (asksBody) asksBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Loading asks...</td></tr>';

  try {
    const data = await API.getMarketDepth(resId);
    const orders = data.orders || [];
    const offers = data.offers || [];

    if (bidsBody) {
      bidsBody.innerHTML = orders.length ? orders.map(o => `
        <tr>
          <td style="color: var(--success);">$${o.unitPrice}</td>
          <td>${o.quantity}</td>
          <td>Company #${o.company_id || '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No active buy orders</td></tr>';
    }

    if (asksBody) {
      asksBody.innerHTML = offers.length ? offers.map(o => `
        <tr>
          <td style="color: var(--danger);">$${o.unitPrice}</td>
          <td>${o.quantity}</td>
          <td>Company #${o.company_id || '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No active sell offers</td></tr>';
    }
  } catch (err) {
    if (bidsBody) bidsBody.innerHTML = `<tr><td colspan="3" style="color: var(--danger);">${err.message}</td></tr>`;
    if (asksBody) asksBody.innerHTML = `<tr><td colspan="3" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function loadStores() {
  const container = document.getElementById('storesContainer');
  if (!container) return;
  container.innerHTML = '<p style="color: var(--text-muted);">Loading stores...</p>';

  try {
    const companies = await API.listCompanies({ type: 2 });
    if (!Array.isArray(companies) || companies.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">No WebStores found</p>';
      return;
    }

    container.innerHTML = companies.map(s => `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏪 ${escapeHtml(s.name)}</div>
          <span class="badge badge-store">WebStore</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Treasury: $${Number(s.cash || 0).toLocaleString()}</p>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="qty-store-${s.id}" min="1" value="1" class="form-control" style="width: 80px;" />
          <button class="btn btn-success btn-sm" onclick="buyFood(${s.id})">Buy Food</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
}

async function loadPortfolio() {
  const tableBody = document.getElementById('portfolioTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Loading portfolio...</td></tr>';

  try {
    const data = await API.getPortfolio();
    const list = data.portfolio || [];
    if (!list.length) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No shares owned</td></tr>';
      return;
    }

    tableBody.innerHTML = list.map(item => `
      <tr>
        <td>#${item.company_id}</td>
        <td><strong>${escapeHtml(item.company_name)}</strong></td>
        <td>${item.quantity}</td>
        <td>${item.shares_outstanding}</td>
        <td><strong>${item.ownership_percentage}%</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewCapTable(${item.company_id})">Cap Table</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function loadUsers() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Loading users...</td></tr>';

  try {
    const users = await API.listUsers();
    if (!Array.isArray(users) || users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No users found</td></tr>';
      return;
    }

    tableBody.innerHTML = users.map(u => `
      <tr>
        <td><strong>#${u.id}</strong></td>
        <td>${escapeHtml(u.username)}</td>
        <td>${u.joined ? new Date(u.joined * 1000).toLocaleDateString() : '-'}</td>
        <td>${u.active ? '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">Active</span>' : '<span class="badge" style="background: rgba(107, 114, 128, 0.2); color: #9ca3af;">Inactive</span>'}</td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

// Action helpers
window.workAtCompany = async function(companyId) {
  try {
    const res = await API.work(companyId);
    showToast(`Work completed! Wage earned: $${res.wage_paid || 0}`, 'success');
    loadCompanies();
  } catch (err) {
    showToast(err.message || 'Work shift failed', 'danger');
  }
};

window.buyFood = async function(storeId) {
  const qtyInput = document.getElementById(`qty-store-${storeId}`);
  const qty = qtyInput ? Number(qtyInput.value) : 1;
  try {
    const res = await API.buyFromStore(storeId, qty);
    showToast(`Purchased ${res.quantity} food for $${res.total_cost}! Electricity consumed: ${res.electricity_used}`, 'success');
  } catch (err) {
    showToast(err.message || 'Store purchase failed', 'danger');
  }
};

window.triggerSimTick = async function() {
  try {
    const res = await API.triggerStoreTick();
    if (res.purchased) {
      showToast(`NPC Simulation: Bought ${res.quantity} food from ${res.store_name} for $${res.revenue}`, 'success');
    } else {
      showToast(res.message || 'No NPC purchase occurred this tick', 'info');
    }
  } catch (err) {
    showToast(err.message || 'Tick failed', 'danger');
  }
};

// Event Listeners setup
function setupEventListeners() {
  // Found Company form
  const btnFoundModal = document.getElementById('btnFoundModal');
  if (btnFoundModal) btnFoundModal.addEventListener('click', () => openModal('modalFound'));

  const formFound = document.getElementById('formFound');
  if (formFound) {
    formFound.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('foundName').value.trim();
      const type = document.getElementById('foundType').value;
      try {
        const res = await API.foundCompany(name, type);
        closeAllModals();
        showToast(`Company '${name}' founded successfully (ID: #${res.id})!`, 'success');
        loadCompanies();
      } catch (err) {
        showToast(err.message || 'Founding company failed', 'danger');
      }
    });
  }

  // Market resource change
  const resSelect = document.getElementById('marketResourceSelect');
  if (resSelect) {
    resSelect.addEventListener('change', () => loadMarketDepth());
  }

  // Tick simulation button
  const btnSimTick = document.getElementById('btnSimTick');
  if (btnSimTick) {
    btnSimTick.addEventListener('click', window.triggerSimTick);
  }
}

// Modal handling
function initModals() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
}

// Toast helper
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
