const Oscillator = require('./Oscillator.js');
const utilities = require('../server/utilities.js');
const drawing = require('./drawing.js');
const Screen = require('./Screen.js');
const Menu = require('./Menu.js');

class TitleScreen extends Screen {
  constructor(client) {
    super();
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
    drawing.drawTitleScreen(camera, this.titleOsc, this.menu);
  }

  keyDown(e) {
    this.client.keyclick.play();
    if(this.menu) {
      this.menu.key(e);
    }
    else {
      if(e.key === 'Enter') {
        this.menu = new Menu([
          { text: 'Play', func: () => this.client.switchScreen(this.client.chooseShipScreen) },
          { text: 'Build', func: () => this.client.switchScreen(this.client.builderScreen) }
        ]);
      }
    }     
  }

  onExit() {
    this.client.titleStinger.play();
  }
}

module.exports = TitleScreen;