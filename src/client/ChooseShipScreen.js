const EntryScreen = require('./EntryScreen.js');
const drawing = require('./drawing.js');

class ChooseShipScreen extends EntryScreen {
  constructor(client) {
    super(client, client.shipWaitScreen, 'ship');
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawEntryScreen(this.client.camera, "Enter ship name", this.entry);
    drawing.drawChooseShipScreen(this.client.camera, this.entry, this.client.shipList);
  }
}

module.exports = ChooseShipScreen;