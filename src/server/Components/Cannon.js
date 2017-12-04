const utilities = require('../utilities.js');
const id = require('../id.js');
const Ammo = require('./Ammo.js');

class Cannon {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.firing = false;
    this.lastFireTime = 0;
    this.cd = 0.12;
    this.power = 10000;
    this.ammo = new Ammo(
      utilities.deepObjectMerge.call({}, objectParams.ammo),
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Cannon;
