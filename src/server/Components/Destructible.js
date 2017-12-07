const utilities = require('../utilities.js');
const id = require('../id.js');
const Shield = require('./Shield.js');

class Destructible {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.hp = 500;
    this.maxHp = (objectParams.hp) ? objectParams.hp : 500;
    this.radius = 500;
    this.shield = new Shield(
      utilities.deepObjectMerge.call({}, objectParams.shield),
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
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
