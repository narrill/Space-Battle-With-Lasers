const utilities = require('../utilities.js');

class StabilizerClamps {
  constructor(objectParams = {}) {
    this.enabled = true;
    this.medial = 1000;
    this.lateral = 660;
    this.rotational = 90;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = StabilizerClamps;
