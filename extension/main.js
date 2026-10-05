document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatHistory = document.getElementById('chat-history');
  
  const canvas = document.getElementById('eye-canvas');
  const ctx = canvas.getContext('2d');
  const card = document.querySelector('.character-card');

  function resizeCanvas() {
    canvas.width = card.clientWidth;
    canvas.height = card.clientHeight;
  }
  resizeCanvas();

  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  let isTalking = false;

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // Titik Koordinat Mata & Mulut Kucing pada Gambar
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const leftEye = { x: canvas.width * 0.38, y: canvas.height * 0.44 };
    const rightEye = { x: canvas.width * 0.62, y: canvas.height * 0.44 };

    // Hitung offset gerakan pupil
    function getPupilOffset(eye) {
      const dx = mouseX - eye.x;
      const dy = mouseY - eye.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 4;
      const angle = Math.atan2(dy, dx);
      const move = Math.min(dist / 30, maxDist);
      return { x: Math.cos(angle) * move, y: Math.sin(angle) * move };
    }

    const offL = getPupilOffset(leftEye);
    const offR = getPupilOffset(rightEye);

    // Gambar pupil halus di dalam mata
    ctx.fillStyle = '#3a2e2b';
    ctx.beginPath();
    ctx.ellipse(leftEye.x + offL.x, leftEye.y + offL.y, 4, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(rightEye.x + offR.x, rightEye.y + offR.y, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animasi Mulut saat AI membalas
    if (isTalking && Math.floor(Date.now() / 150) % 2 === 0) {
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.49, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();

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
    loadingDiv.innerText = 'Kucing sedang mengetik...';
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    isTalking = true;

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      document.getElementById('loading-msg')?.remove();
      
      appendMessage('bot', data.reply);
      setTimeout(() => { isTalking = false; }, 2500);
    } catch (err) {
      document.getElementById('loading-msg')?.remove();
      appendMessage('bot', 'Meow... Backend AI offline.');
      isTalking = false;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
