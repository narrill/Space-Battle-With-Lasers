require('./optionalBind.js');

class Screen {
  constructor() {
    this.optionalBind('keyDown');
    this.optionalBind('keyUp');
    this.optionalBind('mouse');
  }
}

module.exports = Screen;