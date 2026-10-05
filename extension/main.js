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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const leftEye = { x: canvas.width * 0.38, y: canvas.height * 0.44 };
    const rightEye = { x: canvas.width * 0.62, y: canvas.height * 0.44 };

    function getPupilOffset(eye) {
      const dx = mouseX - eye.x;
      const dy = mouseY - eye.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 3;
      const angle = Math.atan2(dy, dx);
      const move = Math.min(dist / 35, maxDist);
      return { x: Math.cos(angle) * move, y: Math.sin(angle) * move };
    }

    const offL = getPupilOffset(leftEye);
    const offR = getPupilOffset(rightEye);

    // Pupil Mata Halus
    ctx.fillStyle = '#3a2e2b';
    ctx.beginPath();
    ctx.ellipse(leftEye.x + offL.x, leftEye.y + offL.y, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(rightEye.x + offR.x, rightEye.y + offR.y, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animasi Mulut Minimalis & Natural (Garis Senyum bergerak sedikit)
    if (isTalking) {
      const talkOffset = (Math.sin(Date.now() / 100) * 1.5);
      ctx.strokeStyle = '#3a2e2b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5, canvas.height * 0.485 + (talkOffset * 0.3), 3, 0, Math.PI);
      ctx.stroke();
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
    loadingDiv.innerText = 'Kucing sedang ngetik...';
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
      setTimeout(() => { isTalking = false; }, 2000);
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
