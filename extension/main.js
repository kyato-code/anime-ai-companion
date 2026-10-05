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

    // Muat model Cubism 2 lokal
    const model = await PIXI.live2d.Live2DModel.from('assets/shizuku/shizuku.model.json');
    app.stage.addChild(model);

    model.scale.set(0.2);
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height / 2;
    model.anchor.set(0.5, 0.5);

    window.addEventListener('pointermove', (e) => {
      model.focus(e.clientX, e.clientY);
    });

    console.log("Model Live2D berhasil dimuat!");
  } catch (err) {
    console.error("Gagal Render Live2D:", err);
  }

  // Logika Chat System
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
