class OENavbar extends HTMLElement {
  connectedCallback() {
    const page = this.getAttribute('current-page') || '';
    this.innerHTML = `
      <nav class="navbar">
        <a href="/" class="nav-brand"><div class="brand-icon">OE</div><span class="brand-title">OurEconomy</span></a>
        <ul class="nav-links">
          <li><a href="/" class="${page === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
          <li><a href="/companies/" class="${page === 'companies' ? 'active' : ''}">Companies</a></li>
          <li><a href="/found/" class="${page === 'found' ? 'active' : ''}">Found</a></li>
          <li><a href="/market/" class="${page === 'market' ? 'active' : ''}">Market</a></li>
          <li><a href="/stores/" class="${page === 'stores' ? 'active' : ''}">WebStores</a></li>
          <li><a href="/portfolio/" class="${page === 'portfolio' ? 'active' : ''}">Portfolio</a></li>
          <li><a href="/users/" class="${page === 'users' ? 'active' : ''}">Citizens</a></li>
        </ul>
        <div class="nav-auth" id="navAuth">
          <a href="/login/" class="btn btn-secondary btn-sm">Login</a>
          <a href="/signup/" class="btn btn-primary btn-sm">Sign Up</a>
        </div>
      </nav>
    `;
    if (typeof renderAuthNav === 'function') renderAuthNav();
  }
}
customElements.define('oe-navbar', OENavbar);
