const utilities = require('../utilities.js');
const id = require('../id.js');
const Thruster = require('./Thruster.js');

class ThrusterSystem {
  constructor(owner, objectParams = {}) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.color = utilities.getRandomBrightColor();
    this.noiseLevel = 0;
    this.medial = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 1000,
      efficiency: 300,
    }, objectParams.medial));
    this.lateral = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 660,
      efficiency: 300,
    }, objectParams.lateral));
    this.rotational = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 250,
      efficiency: 100,
    }, objectParams.rotational));

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = ThrusterSystem;
