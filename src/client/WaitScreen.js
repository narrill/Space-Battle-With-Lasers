const Screen = require('./Screen.js');

class WaitScreen extends Screen {
  constructor(client) {
    super();
    this.optionalBind('checkGameStart');
    this.client = client;
    this.firstWI = false;
  }

  onEnter() {
    const client = this.client;
    const socket = client.socket;
    socket.on('badShipError', client.switchScreen.bind(client, client.chooseShipScreen));
    socket.on('worldInfoInit', this.checkGameStart);
    socket.on('worldInfo', this.checkGameStart);
  }

  onExit() {
    const client = this.client;
    const socket = client.socket;
    socket.off('badShipError');
    socket.off('worldInfoInit', this.checkGameStart);
    socket.off('worldInfo', this.checkGameStart);
  }

  checkGameStart() {
    const wi = this.client.worldInfo;
    if(wi.initialized && wi.hasData)
      this.client.switchScreen(this.client.gameScreen);
  }
}

module.exports = WaitScreen;