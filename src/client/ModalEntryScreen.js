const ModalScreen = require('./ModalScreen.js');
const drawing = require('./drawing.js');

class ModalEntryScreen extends ModalScreen {
  constructor(client, previousScreen, callback) {
    super(client, previousScreen, callback);
  }

  draw(now, dt) {
    super.draw(now, dt);
    drawing.drawEntryScreen(this.client.camera, "Enter a value", this.entry);
  }

  keyDown(e) {
    if(e.key === 'Backspace'){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      const number = Number.parseFloat(this.entry);
      if(!Number.isNaN(number))
        this.exitModal(number);
      else if(this.entry === 'true' || this.entry === 'false')
        this.exitModal((this.entry === 'true') ? true : false);
      else
        this.exitModal(this.entry);
    }
    else
      this.entry += e.key;
  }

  onEnter(){
    this.entry = "";
  }
}

module.exports = ModalEntryScreen;