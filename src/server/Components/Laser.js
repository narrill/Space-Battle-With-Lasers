const utilities = require('../utilities.js');
const collisions = require('../collisions.js');

class Laser {
  constructor(bp, owner) {
    this.owner = owner;
    this.lastFireTime = 0;
    this.color = utilities.getRandomBrightColor();
    this.currentPower = 0;
    this.collisionFunction = collisions.basicLaserCollision;
    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      cd: 0.5,
      range: 200,
      coherence: 0.997,
      maxPower: 2000,
      efficiency: 50,
      spread: 0,
    }, params);
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
        this.collisionFunction,
        {
          power: this.currentPower,
          efficiency: this.efficiency,
        },
      );
    }
    this.currentPower -= this.maxPower * (1 - this.coherence) * dt * 1000;
    if (this.currentPower < 0) {
      this.currentPower = 0;
    }
  }
}

Laser.isBuildable = true;

module.exports = Laser;
