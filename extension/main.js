document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatHistory = document.getElementById('chat-history');
  
  const pupilLeft = document.getElementById('pupil-left');
  const pupilRight = document.getElementById('pupil-right');
  const catMouth = document.getElementById('cat-mouth');

  // Gerakan Mata Mengikuti Mouse
  window.addEventListener('mousemove', (e) => {
    const rect = document.getElementById('avatar-container').getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const distance = Math.min(4, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 30);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    pupilLeft.setAttribute('transform', `translate(${moveX}, ${moveY})`);
    pupilRight.setAttribute('transform', `translate(${moveX}, ${moveY})`);
  });

  // Animasi Mulut Berbicara
  function startTalking() {
    let open = false;
    const talkInterval = setInterval(() => {
      open = !open;
      if (open) {
        catMouth.setAttribute('d', 'M 144 146 Q 150 156 156 146 Z');
        catMouth.setAttribute('fill', '#ffb7c5');
      } else {
        catMouth.setAttribute('d', 'M 144 146 Q 150 150 156 146');
        catMouth.setAttribute('fill', 'none');
      }
    }, 150);

    return () => {
      clearInterval(talkInterval);
      catMouth.setAttribute('d', 'M 144 146 Q 150 150 156 146');
      catMouth.setAttribute('fill', 'none');
    };
  }

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

    appendMessage('user', text);
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message');
    loadingDiv.id = 'loading-msg';
    loadingDiv.innerText = 'Ngetik balasan...';
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const stopTalking = startTalking();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      document.getElementById('loading-msg')?.remove();
      
      appendMessage('bot', data.reply);
      setTimeout(() => stopTalking(), 2500);
    } catch (err) {
      document.getElementById('loading-msg')?.remove();
      appendMessage('bot', 'Backend offline.');
      stopTalking();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
