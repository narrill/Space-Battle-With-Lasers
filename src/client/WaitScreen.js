class WaitScreen {
  constructor(client) {
    this.client = client;
    this.firstWI = false;
  }

  onEnter() {
    const client = this.client;
    const socket = client.socket;
    socket.on('badShipError', client.switchScreen.bind(client, client.chooseShipScreen));
    socket.on('worldInfoInit', checkGameStart);
    socket.on('worldInfo', checkGameStart);
  }

  onExit() {
    const client = this.client;
    const socket = client.socket;
    socket.off('badShipError');
    socket.off('worldInfoInit', checkGameStart);
    socket.off('worldInfo', checkGameStart);
  }

  checkGameStart() {
    const wi = this.client.worldInfo;
    if(wi.initialized && wi.hasData)
      this.client.switchScreen(this.client.gameScreen);
  }
}

module.exports = WaitScreen;