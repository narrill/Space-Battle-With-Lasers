const utilities = require('../utilities.js');
const Shield = require('./Shield.js');

class Destructible {
  constructor(bp) {
    this.hp = bp.maxHp;

    utilities.veryShallowObjectMerge.call(this, bp);
    this.shield = new Shield(bp.shield);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      maxHp: 500,
      radius: 500,
      shield: Shield.getBP(params.shield)
    }, params);
  }

  update(dt) {
    // refresh shields
    if (this.shield.current < this.shield.max
      && this.shield.recharge > 0) {
      this.shield.current += this.shield.recharge * dt;

      if (this.shield.current > this.shield.max) {
        this.shield.current = this.shield.max;
      }
    }
  }

  get isDead() {
    return this.hp <= 0;
  }
}

module.exports = Destructible;
