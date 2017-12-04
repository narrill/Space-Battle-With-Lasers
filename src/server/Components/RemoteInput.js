const utilities = require('../utilities.js');
const id = require('../id.js');

class RemoteInput {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.keyboard = [];
    this.mouse = [];
    this.mouseDirection = 0;
    this.lastSend = 0;
    this.sendInterval = 66.6666;
    this.nonInterp = {};

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  messageHandler(data) {
    if (data.disconnect && this.remoteSend) { delete this.remoteSend; }
    if (data.keyCode) { this.keyboard[data.keyCode] = data.pos; }
    if (data.mb || data.mb === 0) { this.mouse[data.mb] = data.pos; }
    if (data.md || data.md === 0) {
      this.mouseDirection = data.md;
    }
  }
}

module.exports = RemoteInput;