const EntryScreen = require('./EntryScreen.js');
const drawing = require('./drawing.js');

class NameScreen extends EntryScreen {
  constructor(client) {
    super(client, client.nameWaitScreen, 'name');
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawEntryScreen(this.client.camera, "Enter a name", this.entry);
  }
}

module.exports = NameScreen;