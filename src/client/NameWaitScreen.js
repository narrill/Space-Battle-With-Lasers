const Screen = require('./Screen.js');

class NameWaitScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
  }

  onEnter() {
    const client = this.client;
    const socket = client.socket;
    socket.on('badName', client.switchScreen.bind(client, client.nameScreen));
    socket.on('goodName', client.switchScreen.bind(client, client.chooseShipScreen));
  }

  onExit() {
    const client = this.client;
    const socket = client.socket;
    socket.off('badName');
    socket.off('goodName');
  }
}

module.exports = NameWaitScreen;