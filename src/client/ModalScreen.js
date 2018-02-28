const Screen = require('./Screen.js');
const drawing = require('./drawing.js');

class ModalScreen extends Screen {
  constructor(client, previousScreen, callback) {
    super();
    this.client = client;
    this.previousScreen = previousScreen;
    this.callback = callback;
  }

  update(dt) {
    if(this.previousScreen.update)
      this.previousScreen.update(dt);
  }

  draw(now, dt) {
    if(this.previousScreen.draw)
      this.previousScreen.draw(now, dt);
    const camera = this.client.camera;
    const ctx = camera.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawing.clearCamera(camera);
    ctx.restore();
  }

  exitModal(val) {
    this.callback(val);
    this.client.exitModal(this.previousScreen);
  }
}

module.exports = ModalScreen;