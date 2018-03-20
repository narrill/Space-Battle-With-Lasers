const utilities = require('../utilities.js');
const Destructible = require('./Destructible.js');
const collisions = require('../collisions.js');

class Ammo {
  constructor(bp) {
    this.destructible = new Destructible(bp.destructible);
    this.color = new utilities.ColorRGB(bp.color); // yellow
    this.collisionFunction = collisions.basicKineticCollision;
    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      destructible: Destructible.getBP(utilities.deepObjectMerge.call({
        maxHp: 25,
        radius: 10,
      }, params.destructible)),
      decayTimeSeconds: 2,
      color: utilities.deepObjectMerge.call({
        r: 255, g: 255, b: 0,
      }, params.color),
    }, params);
  }
}

module.exports = Ammo;
