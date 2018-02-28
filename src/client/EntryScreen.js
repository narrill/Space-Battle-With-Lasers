const Screen = require('./Screen.js');

class EntryScreen extends Screen {
  constructor(client, waitScreen, message) {
    super();
    this.client = client;
    this.waitScreen = waitScreen;
    this.message = message;
  }

  keyDown(e) {
    if(e.key === 'Backspace'){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      this.client.switchScreen(this.waitScreen);
      this.client.socket.emit(this.message, this.entry);
    }
    else
      this.entry += e.key;
  }

  onEnter(){
    this.entry = "";
  }
}

module.exports = EntryScreen;