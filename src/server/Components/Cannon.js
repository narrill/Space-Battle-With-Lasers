const utilities = require('../utilities.js');
const Ammo = require('./Ammo.js');
const Destructible = require('./Destructible.js');
const collisions = require('../collisions.js');

class Cannon {
  constructor(bp, owner) {
    this.owner = owner;
    this.firing = false;
    this.lastFireTime = 0;

    utilities.veryShallowObjectMerge.call(this, bp);

    this.ammo = new Ammo(bp.ammo);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      cd: .12,
      power: 10000,
      spread: 5,
      multiShot: 1,
      ammo: Ammo.getBP(params.ammo)
    }, params);
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
          ammo.collisionFunction,
        );
      }
      this.firing = false;
    }
  }
}

Cannon.isBuildable = true;

module.exports = Cannon;
