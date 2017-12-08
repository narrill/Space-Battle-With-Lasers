const utilities = require('../utilities.js');
const id = require('../id.js');
const Ammo = require('./Ammo.js');
const Destructible = require('./Destructible.js');
const collisions = require('../collisions.js');

class Cannon {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
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

  update() {
    const forwardVector = utilities.getForwardVector.call(this.owner);
    // create projectiles
    if (this.firing) {
      const prjVelocity = [
        forwardVector[0] * this.power,
        forwardVector[1] * this.power,
      ];
      const ammo = this.ammo;
      this.owner.game.createPrj(
        this.owner.game,
        this.owner.x + (forwardVector[0] * 30),
        this.owner.y + (forwardVector[1] * 30),
        prjVelocity[0] + this.owner.velocityX,
        prjVelocity[1] + this.owner.velocityY,
        new Destructible(ammo.destructible),
        ammo.color,
        this.owner,
        collisions[ammo.collisionFunction],
      );
      this.firing = false;
      ammo.tracerSeed++;
    }
  }
}

module.exports = Cannon;
