const Screen = require('./Screen.js');
const drawing = require('./drawing.js');

class DisconnectScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawDisconnectScreen(this.client.camera);
  }

  keyDown(e) {
    if(e.key === 'Enter') {
      this.client.keyclick.play();
      this.client.switchScreen(this.client.chooseShipScreen);
    }
  }
}

module.exports = DisconnectScreen;