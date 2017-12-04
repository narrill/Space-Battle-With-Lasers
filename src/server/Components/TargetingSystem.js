const utilities = require('../utilities.js');
const id = require('../id.js');

class TargetingSystem {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.targets = [];
    this.maxTargets = 1;
    this.range = 50000;
    this.lockConeWidth = 45;
    this.lockTime = 3;
    this.lockedTargets = [];

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = TargetingSystem;
