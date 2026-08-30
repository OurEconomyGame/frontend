/**
 * OurEconomy API Client
 * Backend target: https://oureconomy.server.napp9.com:443
 */

const API = {
  baseUrl: 'https://oureconomy.server.napp9.com',

  // Auth management
  getToken() {
    return localStorage.getItem('oe_auth_token') || '';
  },

  setAuth(token, username = '', userId = null) {
    if (token) {
      localStorage.setItem('oe_auth_token', token);
      if (username) localStorage.setItem('oe_username', username);
      if (userId !== null) localStorage.setItem('oe_user_id', String(userId));
    } else {
      localStorage.removeItem('oe_auth_token');
      localStorage.removeItem('oe_username');
      localStorage.removeItem('oe_user_id');
    }
  },

  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;
    return {
      token,
      username: localStorage.getItem('oe_username') || 'User',
      userId: localStorage.getItem('oe_user_id') || null
    };
  },

  // Base HTTP helper
  async request(path, options = {}) {
    const url = new URL(path, this.baseUrl);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token && !headers['Auth']) {
      headers['Auth'] = token;
    }

    if (options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, val);
        }
      });
    }

    const config = {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };

    try {
      const response = await fetch(url.toString(), config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${config.method} ${path}]:`, err);
      throw err;
    }
  },

  // System
  async getVersion() {
    return this.request('/version');
  },

  // Auth
  async signup(username, password) {
    return this.request('/signup', {
      method: 'POST',
      body: { hi: username, secret: password }
    });
  },

  async login(username, password) {
    return this.request('/login', {
      method: 'POST',
      body: { hi: username, secret: password }
    });
  },

  // Users & Portfolio
  async listUsers(sortBy = 'id') {
    return this.request('/list/users', { params: { sortBy } });
  },

  async getPortfolio() {
    return this.request('/portfolio');
  },

  // Companies
  async listCompanies(params = {}) {
    return this.request('/list/companies', { params });
  },

  async getCompany(query = {}) {
    return this.request('/company', { params: query });
  },

  async getShareholders(query = {}) {
    return this.request('/company/shareholders', { params: query });
  },

  async foundCompany(name, type) {
    return this.request('/found', {
      method: 'POST',
      body: { name, type: Number(type) }
    });
  },

  async buyFacility(companyId, recipe, name) {
    const body = { company_id: Number(companyId), recipe };
    if (name) body.name = name;
    return this.request('/facility/buy', {
      method: 'POST',
      body
    });
  },

  async work(companyId) {
    return this.request('/company/work', {
      method: 'POST',
      body: { company_id: Number(companyId) }
    });
  },

  async setWage(companyId, wage) {
    return this.request('/company/wage', {
      method: 'POST',
      body: { company_id: Number(companyId), wage: Number(wage) }
    });
  },

  async fireWorker(companyId, workerId) {
    return this.request('/company/fire', {
      method: 'POST',
      body: { company_id: Number(companyId), worker_id: Number(workerId) }
    });
  },

  async quitJob(companyId) {
    return this.request('/company/quit', {
      method: 'POST',
      body: { company_id: Number(companyId) }
    });
  },

  async deposit(companyId, amount) {
    return this.request('/company/deposit', {
      method: 'POST',
      body: { company_id: Number(companyId), amount: Number(amount) }
    });
  },

  async distributeDividend(companyId, amount) {
    return this.request('/company/dividend', {
      method: 'POST',
      body: { company_id: Number(companyId), amount: Number(amount) }
    });
  },

  // WebStore
  async setStorePrice(companyId, price) {
    return this.request('/store/price', {
      method: 'POST',
      body: { company_id: Number(companyId), price: Number(price) }
    });
  },

  async buyFromStore(companyId, quantity) {
    return this.request('/store/buy', {
      method: 'POST',
      body: { company_id: Number(companyId), quantity: Number(quantity) }
    });
  },

  async triggerStoreTick() {
    return this.request('/store/tick', {
      method: 'POST'
    });
  },

  // Market
  async getMarketDepth(resource) {
    return this.request('/market/depth', {
      params: { resource: Number(resource) }
    });
  },

  async marketBuy(companyId, resource, quantity, unitPrice) {
    return this.request('/market/buy', {
      method: 'POST',
      body: {
        company_id: Number(companyId),
        resource: Number(resource),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice)
      }
    });
  },

  async marketSell(companyId, resource, quantity, unitPrice) {
    return this.request('/market/sell', {
      method: 'POST',
      body: {
        company_id: Number(companyId),
        resource: Number(resource),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice)
      }
    });
  },

  async marketCancel(companyId, { order_id, offer_id } = {}) {
    const body = { company_id: Number(companyId) };
    if (order_id !== undefined) body.order_id = Number(order_id);
    if (offer_id !== undefined) body.offer_id = Number(offer_id);
    return this.request('/market/cancel', {
      method: 'POST',
      body
    });
  }
};
