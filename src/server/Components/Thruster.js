const utilities = require('../utilities.js');
const id = require('../id.js');

class Thruster {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.currentStrength = 0;
    this.targetStrength = 0;
    this.maxStrength = 1000;
    this.efficiency = 1000;
    this.powerRampPercentage = 20;
    this.powerRampLimit = 6000;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Thruster;