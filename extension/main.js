document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('live2d-canvas');
  
  try {
    const app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      resizeTo: canvas,
      transparent: true,
      backgroundAlpha: 0
    });

    // Menggunakan URL CDN sampel Mao Live2D Cubism 2 yang kompatibel
    const modelUrl = 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json';

    const model = await PIXI.live2d.Live2DModel.from(modelUrl, {
      autoInteract: true
    });

    app.stage.addChild(model);

    // Atur ukuran & posisi agar pas di tengah canvas
    model.scale.set(0.15);
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height / 2 + 30;
    model.anchor.set(0.5, 0.5);

    // Track pergerakan kursor mouse
    window.addEventListener('pointermove', (e) => {
      model.focus(e.clientX, e.clientY);
    });

    console.log("Model Live2D berhasil dimuat!");
  } catch (err) {
    console.error("Gagal Render Live2D:", err);
  }

  // Integrasi Chatbox ke Backend FastAPI
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = 'Berpikir...';
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      alert('Hikari: ' + data.reply);
    } catch (err) {
      alert('Gagal terhubung ke backend AI.');
    } finally {
      userInput.value = '';
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
