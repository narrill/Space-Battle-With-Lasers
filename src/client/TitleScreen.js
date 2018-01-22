const Oscillator = require('./Oscillator.js');

class TitleScreen {
  constructor(client) {
    this.client = client;

    this.titleOsc = new Oscillator(6);
    this.titleCameraOsc = new Oscillator(60);
  }

  draw(now, dt) {
    const camera = this.client.camera;
    const nowS = now / 1000;
    camera.x = this.titleCameraOsc.getValue(nowS) * 100000;
    camera.y = this.titleCameraOsc.getValue(nowS + this.titleCameraOsc.period/4) * 100000;
    camera.rotation = utilities.correctOrientation(camera.rotation + .1 * dt);
    drawing.drawTitleScreen(camera, this.titleOsc);
  }

  keyDown(e) {
    if(!e.repeat)
      this.client.keyclick.play();
    if(e.keyCode === this.client.myKeys.KEYBOARD.KEY_ENTER) {
      this.client.switchScreen(this.client.chooseShipScreen);
    }
  }

  onExit() {
    this.client.titleStinger.play();
  }
}

module.exports = TitleScreen;