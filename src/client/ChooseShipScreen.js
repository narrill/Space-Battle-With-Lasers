class ChooseShipScreen {
  constructor(client) {
    this.client = client;
  }

  update(dt) {

  }

  draw(now, dt) {
    drawing.drawChooseShipScreen(this.client.camera, this.entry, this.client.shipList);
  }

  keyHandler(e) {
    if(!e.repeat) playStinger(keyclick);
    if(e.keyCode === 8){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.keyCode === this.client.myKeys.KEYBOARD.KEY_ENTER) {
      this.client.switchScreen(this.client.waitScreen);
      this.client.socket.emit('ship', entry);
    }
    else
      this.entry += String.fromCharCode(e.keyCode);
  }

  onEnter(){
    this.entry = "";
  }

  onExit() {

  }
}