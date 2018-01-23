const Screen = require('./Screen.js');
const drawing = require('./drawing.js');

class ChooseShipScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawChooseShipScreen(this.client.camera, this.entry, this.client.shipList);
  }

  keyDown(e) {
    if(e.key === 'Backspace'){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      this.client.switchScreen(this.client.waitScreen);
      this.client.socket.emit('ship', this.entry);
    }
    else
      this.entry += e.key;
  }

  onEnter(){
    this.entry = "";
  }
}

module.exports = ChooseShipScreen;