class OEFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>OurEconomy &bull; Static Frontend connected to oureconomy.server.napp9.com:443</footer>
    `;
  }
}
customElements.define('oe-footer', OEFooter);
