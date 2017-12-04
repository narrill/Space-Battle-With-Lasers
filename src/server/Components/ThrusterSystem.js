const dependencyCatch = require('../dependencyCatch.js');
const utilities = require('../utilities.js');
const id = require('../id.js');
const constructors = dependencyCatch(require('../constructors.js'));

class ThrusterSystem {
  constructor(owner, objectParams = {}) {
    this.owner = owner;
    this.id = id.takeIdTag(),
    this.color = utilities.getRandomBrightColor(),
    this.noiseLevel = 0,
    this.medial = constructors.createComponentThruster(utilities.deepObjectMerge.call({
      maxStrength: 1000,
      efficiency: 300,
    }, objectParams.medial)),
    this.lateral = constructors.createComponentThruster(utilities.deepObjectMerge.call({
      maxStrength: 660,
      efficiency: 300,
    }, objectParams.lateral)),
    this.rotational = constructors.createComponentThruster(utilities.deepObjectMerge.call({
      maxStrength: 250,
      efficiency: 100,
    }, objectParams.rotational)),

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = ThrusterSystem;