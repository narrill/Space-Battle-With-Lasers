const utilities = require('../utilities.js');
const StabilizerClamps = require('./StabilizerClamps.js');

class Stabilizer {
  constructor(bp) {
    this.enabled = true;
    utilities.veryShallowObjectMerge.call(this, bp);
    this.clamps = new StabilizerClamps(bp.clamps);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      strength: 6,
      thrustRatio: 1.5,
      precision: 10,
      clamps: StabilizerClamps.getBP(params.clamps),
    }, params);
  }
}

Stabilizer.isBuildable = true;

module.exports = Stabilizer;
