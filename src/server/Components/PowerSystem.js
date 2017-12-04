const utilities = require('../utilities.js');
const id = require('../id.js');

class PowerSystem {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.current = [0, 0, 0];
    this.target = [0, 0, 0];
    this.transferRate = 6;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = PowerSystem;
