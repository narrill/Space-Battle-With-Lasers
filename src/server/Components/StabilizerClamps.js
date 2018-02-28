const utilities = require('../utilities.js');

class StabilizerClamps {
  constructor(bp) {
    this.enabled = true;

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      medial: 1000,
      lateral: 660,
      rotational: 90,
    }, params);
  }
}

module.exports = StabilizerClamps;
