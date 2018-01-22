const LooseTimer = require('./LooseTimer.js');

class Input {
  constructor() {
    this.keystate = [];
    this.wheel = 0;
    this.mouseX = 0;
    this.lastMouseX = 0;

    this.mouseTimer = new LooseTimer(50, () => {
      if(this.mouseX !== this.lastMouseX) {
        this.lastMouseX = this.mouseX;
        if(this.mouseListener)
          this.mouseListener(this.mouseX);
        this.mouseX = 0;
      }
    });

    window.addEventListener('keydown', (e) => {
      if(!e.repeat) {
        this.keystate[e.code] = 2;

        if(this.pressListener)
          this.pressListener(e);
      }

      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('keyup', (e) => {
      this.keystate[e.code] = 0;
      if(this.releaseListener)
        this.releaseListener(e);
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('mouseDown', (e) => {
      this.keystate[e.button] = 2;
      if(this.pressListener)
        this.pressListener({key: 'LMB', code: e.button});
    });

    window.addEventListener('mouseUp', (e) => {
      this.keystate[e.button] = 0;
      if(this.releaseListener)
        this.releaseListener({key: 'LMB', code: e.button});
    });

    window.addEventListener('mouseWheel', (e) => {
      this.wheel += e.deltaY;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX += e.movementX;
    });
  }

  // Called once per client update, after the screen's update
  update() {
    for(let c = 0; c < this.keystate.length; c++) {
      if(this.keystate[keycodes[c]] === 2)
        this.keystate[keycodes[c]] = 1;
    }
    this.wheel = 0;
    this.mouseTimer.check();
  }

  isPress(keycode) {
    return this.keystate[keycode] === 2;
  }

  isDown(keycode) {
    return this.keystate[keycode] === 1 || this.isPress(keycode);
  }

  setListeners(press, release, mouse) {
    this.pressListener = press;
    this.releaseListener = release;
  }
}

module.exports = Input;