const urlParams = new URLSearchParams(window.location.search), targetTo = urlParams.get('to') || urlParams.get('user');

document.addEventListener('DOMContentLoaded', () => {
  renderAuthNav();
  if (targetTo) {
    const input = document.getElementById('msgReceiverId');
    if (input) input.value = targetTo;
  }
  loadInbox();
  document.getElementById('formSendMessage').addEventListener('submit', handleSendMessage);
  document.getElementById('btnOpenCompose').addEventListener('click', () => {
    document.getElementById('composeCard').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('msgReceiverId').focus();
  });
});

async function loadInbox() {
  const token = getAuthToken(), tbody = document.getElementById('inboxTableBody');
  if (!token) return tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);"><a href="/login/" style="color: var(--primary);">Login</a> to view messages.</td></tr>';

  try {
    const res = await fetch(`${BACKEND}/message/receive`, { headers: { 'Auth': token } });
    const data = await res.json(), msgs = Array.isArray(data.messages) ? data.messages : [];
    if (!msgs.length) return tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No messages received yet.</td></tr>';

    const rows = await Promise.all(msgs.map(async (m) => {
      const senderLink = await renderUserLink(m.sender_id);
      return `<tr><td>${senderLink}</td><td><strong>${escapeHtml(m.subject || '(No Subject)')}</strong></td><td><button class="btn btn-secondary btn-sm" onclick="viewMessage(${m.id})">Read</button></td></tr>`;
    }));
    tbody.innerHTML = rows.join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`; }
}

window.viewMessage = async function(msgId) {
  const token = getAuthToken(), reader = document.getElementById('readerCard');
  if (!token) return showAlert('Please log in.', 'danger');
  try {
    const res = await fetch(`${BACKEND}/message/read?id=${msgId}`, { headers: { 'Auth': token } });
    const data = await res.json(), m = data.message;
    if (!m) return showAlert(data.message || 'Failed to load message', 'danger');

    reader.style.display = 'block';
    document.getElementById('readSubject').textContent = m.subject || '(No Subject)';
    document.getElementById('readSender').innerHTML = await renderUserLink(m.sender_id);
    document.getElementById('readContent').textContent = m.content || '';
    document.getElementById('btnReply').onclick = () => {
      document.getElementById('msgReceiverId').value = m.sender_id;
      document.getElementById('msgSubject').value = `Re: ${m.subject || ''}`;
      document.getElementById('msgContent').focus();
    };
    reader.scrollIntoView({ behavior: 'smooth' });
  } catch (err) { showAlert(err.message, 'danger'); }
};

window.closeReader = function() {
  document.getElementById('readerCard').style.display = 'none';
};

async function handleSendMessage(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return showAlert('Please log in to send messages.', 'danger');

  const receiverId = Number(document.getElementById('msgReceiverId').value);
  const subject = document.getElementById('msgSubject').value.trim();
  const content = document.getElementById('msgContent').value.trim();

  try {
    const res = await fetch(`${BACKEND}/message/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Auth': token }, body: JSON.stringify({ receiver_id: receiverId, subject, content }) });
    const data = await res.json();
    if (data.status === 'Success' || data.id !== undefined) {
      showAlert(`Message sent to Citizen #${receiverId}!`, 'success');
      document.getElementById('msgSubject').value = ''; document.getElementById('msgContent').value = '';
    } else showAlert(data.error || data.message || data.status || 'Failed to send message', 'danger');
  } catch (err) { showAlert(err.message, 'danger'); }
}
