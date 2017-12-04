const utilities = require('../utilities.js');
const id = require('../id.js');
const StabilizerClamps = require('./StabilizerClamps.js');

class Stabilizer {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.enabled = true;
    this.strength = 6;
    this.thrustRatio = 1.5;
    this.precision = 10;
    this.clamps = new StabilizerClamps(
      utilities.deepObjectMerge.call({}, objectParams.clamps),
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Stabilizer;