const utilities = require('../utilities.js');
const id = require('../id.js');

class Laser {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.lastFireTime = 0;
    this.cd = 0.3;
    this.range = 2000;
    this.color = utilities.getRandomBrightColor();
    this.currentPower = 0;
    this.coherence = 0.995;
    this.maxPower = 1000;
    this.efficiency = 50;
    this.spread = 0;
    this.collisionFunction = 'basicLaserCollision';

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Laser;