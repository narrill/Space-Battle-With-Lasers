const Oscillator = require('./Oscillator.js');
const utilities = require('../server/utilities.js');
const drawing = require('./drawing.js');
const Screen = require('./Screen.js');

class Menu {
  constructor(elements) {
    this.elements = elements;
    this.cursor = 0;
  }

  draw(ctx, x, y, font) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    const height = ctx.measureText("M").width;
    const lineHeight = height * 1.5;
    for (let i = this.elements.length - 1; i >= 0; --i) {
      if(this.cursor === i) {
        ctx.save();
        const width = ctx.measureText(this.elements[i].text).width;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'blue';
        ctx.fillRect(x - width/2, y - height/2, width, height);
        ctx.restore();
      }
      ctx.fillText(this.elements[i].text, x, y);
      y -= lineHeight;
    }
    ctx.restore();
  }

  forward() {
    this.cursor = (this.cursor + 1) % this.elements.length;
  }

  backward() {
    this.cursor = (this.cursor - 1) % this.elements.length;
  }

  select() {
    this.elements[this.cursor].func(this.elements[this.cursor]);
  }
}

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
      if(e.key === 'Enter')
        this.menu.select();
      else if(e.key === 'ArrowDown')
        this.menu.forward();
      else if(e.key === 'ArrowUp')
        this.menu.backward();
    }
    else {
      if(e.key === 'Enter') {
        this.menu = new Menu([
          { text: 'Play', func: () => this.client.switchScreen(this.client.nameScreen) },
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