const utilities = require('../utilities.js');
const id = require('../id.js');
const Destructible = require('./Destructible.js');

class Ammo {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.destructible = new Destructible(utilities.deepObjectMerge.call({
      hp: 25,
      radius: 10,
    }, objectParams.destructible));
    this.color = 'yellow';
    this.tracerInterval = 1;
    this.tracerSeed = 0;
    this.collisionFunction = 'basicKineticCollision';

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Ammo;