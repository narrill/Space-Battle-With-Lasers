const utilities = require('../utilities.js');
const id = require('../id.js');
const collisions = require('../collisions.js');

class Laser {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.lastFireTime = 0;
    this.cd = 0.5;
    this.range = 2000;
    this.color = utilities.getRandomBrightColor();
    this.currentPower = 0;
    this.coherence = 0.997;
    this.maxPower = 2000;
    this.efficiency = 50;
    this.spread = 0;
    this.collisionFunction = 'basicLaserCollision';

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update(dt) {
    if (this.currentPower > 0) {
      const owner = this.owner;
      // create laser objects
      const spread = (Math.random() * this.spread) - (this.spread / 2);
      const laserVector = [0, -this.range];
      const currentLaserVector = utilities.rotate(
        0,
        0,
        laserVector[0],
        laserVector[1],
        (-this.owner.rotation) + spread,
      );
      const weaponPoint = this.owner.weaponPoint;
      owner.game.createHitscan(
        owner.game,
        owner.x + weaponPoint[0],
        owner.y + weaponPoint[1],
        owner.x + currentLaserVector[0],
        owner.y + currentLaserVector[1],
        this.color,
        owner,
        collisions[this.collisionFunction],
        {
          power: this.currentPower,
          efficiency: this.efficiency,
        },
        this.id,
      );
    }
    this.currentPower -= this.maxPower * (1 - this.coherence) * dt * 1000;
    if (this.currentPower < 0) {
      this.currentPower = 0;
    }
  }
}

module.exports = Laser;
