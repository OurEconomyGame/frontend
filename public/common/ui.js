function showAlert(msg, type = 'info') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  alertBox.className = `alert alert-${type} visible`;
  alertBox.textContent = msg;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCash(num) {
  return `$${Number(num || 0).toLocaleString()}`;
}
