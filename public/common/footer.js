class OEFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 8px; flex-wrap: wrap;">
          <a href="/info/" style="color: var(--text-muted); text-decoration: none;">Organization</a>
          <span>&bull;</span>
          <a href="/privacy/" style="color: var(--text-muted); text-decoration: none;">Privacy Policy</a>
          <span>&bull;</span>
          <a href="/terms/" style="color: var(--text-muted); text-decoration: none;">Terms of Service</a>
          <span>&bull;</span>
          <a href="https://github.com/OurEconomyGame" target="_blank" rel="noopener" style="color: var(--text-muted); text-decoration: none;">GitHub</a>
        </div>
        <div>OurEconomy &bull; napp9 &bull; connected to oureconomy.server.napp9.com:443</div>
      </footer>
    `;
  }
}
customElements.define('oe-footer', OEFooter);
