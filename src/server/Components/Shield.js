const utilities = require('../utilities.js');

class Shield {
  constructor(bp) {
    this.current = (bp.max) ? bp.max : 0;

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.verShallowUnionOverwrite({
      max: 0,
      efficiency: 0,
      recharge: 0
    }, params);
  }
}

module.exports = Shield;
