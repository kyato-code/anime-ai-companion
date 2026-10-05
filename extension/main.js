const { Application, live2d } = PIXI;

(async function () {
  const app = new Application({
    view: document.getElementById('live2d-canvas'),
    autoStart: true,
    resizeTo: window,
    transparent: true
  });

  const modelUrl = 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json';

  const model = await PIXI.live2d.Live2DModel.from(modelUrl);
  app.stage.addChild(model);

  model.x = app.renderer.width / 2;
  model.y = app.renderer.height / 2;
  model.rotation = 0;
  model.scale.set(0.15);
  model.anchor.set(0.5, 0.5);

  model.on('hit', (hitAreas) => {
    if (hitAreas.includes('body')) {
      model.motion('tap_body');
    }
  });

  window.addEventListener('pointermove', (event) => {
    model.focus(event.clientX, event.clientY);
  });
})();
