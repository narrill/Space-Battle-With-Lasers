class DisconnectScreen {
  constructor(client) {
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