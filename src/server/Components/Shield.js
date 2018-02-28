const utilities = require('../utilities.js');

class Shield {
  constructor(bp) {
    this.current = (bp.max) ? bp.max : 0;

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      max: 0,
      efficiency: 0,
      recharge: 0
    }, params);
  }

  update(dt) {
    // refresh shields
    if (this.current < this.max
      && this.recharge > 0) {
      this.current += this.recharge * dt;

      if (this.current > this.max) {
        this.current = this.max;
      }
    }
  }
}

Shield.isBuildable = true;

module.exports = Shield;
