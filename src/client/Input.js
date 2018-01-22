const LooseTimer = require('./LooseTimer.js');
const inputStates = require('../server/inputStates.js');

class Input {
  constructor() {
    this.keystate = {};
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
  }

  // Called once per client update, after the screen's update
  update() {
    inputStates.advanceStateDictionary(this.keystate);
    this.wheel = 0;
    this.mouseTimer.check();
  }

  isPress(code) {
    return inputStates.isStarting(this.keystate[code]);
  }

  isDown(code) {
    return inputStates.isEnabled(this.keystate[code]);
  }

  setListeners(press, release, mouse) {
    this.pressListener = press;
    this.releaseListener = release;
    this.mouseListener = mouse;
  }

  engage() {
    window.addEventListener('keydown', _keydown);
    window.addEventListener('keyup', _keyup);
    window.addEventListener('mousedown', _mousedown);
    window.addEventListener('mouseup', _mouseup);
    window.addEventListener('wheel', _wheel);
    window.addEventListener('mousemove', _mousemove);
  }

  disengage() {
    window.removeEventListener('keydown', _keydown);
    window.removeEventListener('keyup', _keyup);
    window.removeEventListener('mousedown', _mousedown);
    window.removeEventListener('mouseup', _mouseup);
    window.removeEventListener('wheel', _wheel);
    window.removeEventListener('mousemove', _mousemove);
  }

  _mousedown(e) {
    this.keystate[e.button] = 2;
      if(this.pressListener)
        this.pressListener({key: 'LMB', code: e.button});
  }

  _mouseup(e) {
    this.keystate[e.button] = 0;
      if(this.releaseListener)
        this.releaseListener({key: 'LMB', code: e.button});
  }

  _wheel(e) {
    this.wheel += e.deltaY;
  }

  _mousemove(e) {
    this.mouseX += e.movementX;
  }

  _keydown(e) {
    if(!e.repeat) {
      this.keystate[e.code] = inputStates.STATES.STARTING;

      if(this.pressListener)
        this.pressListener(e);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  _keyup(e) {
    this.keystate[e.code] = inputStates.STATES.DISABLED;
    if(this.releaseListener)
      this.releaseListener(e);
    e.preventDefault();
    e.stopPropagation();
  }
}

module.exports = Input;