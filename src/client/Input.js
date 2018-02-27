const LooseTimer = require('./LooseTimer.js');
const inputState = require('../server/inputState.js');

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

    this._mousedown = (e) => {
      this.keystate[e.button] = 2;
        if(this.pressListener)
          this.pressListener({key: 'LMB', code: e.button});
    };

    this._mouseup = (e) => {
      this.keystate[e.button] = 0;
        if(this.releaseListener)
          this.releaseListener({key: 'LMB', code: e.button});
    };

    this._wheel = (e) => {
      this.wheel -= e.deltaY;
    };

    this._mousemove = (e) => {
      this.mouseX += e.movementX;
    };

    this._keydown = (e) => {
      if(!e.repeat) {
        this.keystate[e.code] = inputState.STATES.STARTING;

        if(this.pressListener)
          this.pressListener(e);
      }

      e.preventDefault();
      e.stopPropagation();
    };

    this._keyup = (e) => {
      this.keystate[e.code] = inputState.STATES.DISABLED;
      if(this.releaseListener)
        this.releaseListener(e);
      e.preventDefault();
      e.stopPropagation();
    };
  }

  // Called once per client update, after the screen's update
  update() {
    inputState.advanceStateDictionary.call(this.keystate);
    this.wheel = 0;
    this.mouseTimer.check();
  }

  isPress(code) {
    return inputState.isStarting(this.keystate[code]);
  }

  isDown(code) {
    return inputState.isEnabled(this.keystate[code]);
  }

  setListeners(press, release, mouse) {
    this.pressListener = press;
    this.releaseListener = release;
    this.mouseListener = mouse;
  }

  engage() {
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('mousedown', this._mousedown);
    window.addEventListener('mouseup', this._mouseup);
    window.addEventListener('wheel', this._wheel);
    window.addEventListener('mousemove', this._mousemove);
  }

  disengage() {
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('mousedown', this._mousedown);
    window.removeEventListener('mouseup', this._mouseup);
    window.removeEventListener('wheel', this._wheel);
    window.removeEventListener('mousemove', this._mousemove);
  }
}

module.exports = Input;