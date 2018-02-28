const utilities = require('../utilities.js');

class Destructible {
  constructor(bp) {
    this.hp = bp.maxHp;

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      maxHp: 500,
      radius: 500,
    }, params);
  }

  get isDead() {
    return this.hp <= 0;
  }
}

module.exports = Destructible;
