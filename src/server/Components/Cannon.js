const utilities = require('../utilities.js');
const Ammo = require('./Ammo.js');
const Destructible = require('./Destructible.js');
const collisions = require('../collisions.js');

class Cannon {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.firing = false;
    this.lastFireTime = 0;
    this.cd = 0.12;
    this.power = 10000;
    this.spread = 5;
    this.multiShot = 1;
    this.ammo = new Ammo(
      utilities.deepObjectMerge.call({}, objectParams.ammo),
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update() {
    // create projectiles
    if (this.firing) {
      const forwardVector = utilities.getForwardVector.call(this.owner);
      const weaponPoint = this.owner.weaponPoint;
      for (let c = 0; c < this.multiShot; c++) {
        const angle = (Math.random() * this.spread) - (this.spread / 2);
        const angledForwardVector = utilities.rotate(
          0,
          0,
          forwardVector[0],
          forwardVector[1],
          angle,
        );
        const prjVelocity = [
          angledForwardVector[0] * this.power,
          angledForwardVector[1] * this.power,
        ];
        const ammo = this.ammo;
        this.owner.game.createPrj(
          this.owner.game,
          this.owner.x + weaponPoint[0],
          this.owner.y + weaponPoint[1],
          prjVelocity[0] + this.owner.velocityX,
          prjVelocity[1] + this.owner.velocityY,
          new Destructible(ammo.destructible),
          ammo.decayTimeSeconds,
          ammo.color,
          this.owner,
          collisions[ammo.collisionFunction],
        );
      }
      this.firing = false;
    }
  }
}

module.exports = Cannon;
