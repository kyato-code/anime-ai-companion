document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatHistory = document.getElementById('chat-history');

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    msgDiv.innerHTML = `<span>${text}</span>`;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Tampilkan pesan pengguna
    appendMessage('user', text);
    userInput.value = '';

    // Tampilkan indikator loading
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message');
    loadingDiv.id = 'loading-msg';
    loadingDiv.innerText = 'Hikari sedang mengetik...';
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      
      // Hapus indikator loading dan tampilkan balasan AI
      document.getElementById('loading-msg')?.remove();
      appendMessage('bot', data.reply);
    } catch (err) {
      document.getElementById('loading-msg')?.remove();
      appendMessage('bot', 'Gagal terhubung ke backend AI.');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
