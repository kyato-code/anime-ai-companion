const { Application } = PIXI;

(async function () {
  try {
    const canvas = document.getElementById('live2d-canvas');
    
    const app = new Application({
      view: canvas,
      autoStart: true,
      resizeTo: canvas,
      transparent: true,
      backgroundAlpha: 0
    });

    // Model Live2D publik alternatif yang stabil
    const modelUrl = 'https://raw.githubusercontent.com/guansss/pixi-live2d-display/master/test/assets/haru/haru_greeter_t03.model3.json';

    const model = await PIXI.live2d.Live2DModel.from(modelUrl);
    app.stage.addChild(model);

    // Atur skala dan posisi pas di tengah canvas
    model.scale.set(0.1);
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height / 2;
    model.anchor.set(0.5, 0.5);

    // Interaksi Mouse Tracking
    window.addEventListener('pointermove', (event) => {
      model.focus(event.clientX, event.clientY);
    });

    // Tap Animation
    model.on('hit', (hitAreas) => {
      if (hitAreas.includes('body')) {
        model.motion('tap_body');
      }
    });

  } catch (err) {
    console.error("Gagal memuat model Live2D:", err);
  }

  // Integrasi Chatbox ke Backend
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
})();
