// Heavily adapated from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/updaters.js

const utilities = require('./utilities.js');

const collisions = {
  dealDamage(dmg) {
    if(this.shield) {
      this.shield.current -= dmg;
      if(this.shield.current < 0) {
        dmg = this.shield.current * (-1);
        this.shield.current = 0;
      }
      else
        dmg = 0;
    }
    this.destructible.hp -= dmg;
  },
  basicLaserCollision: (laser, obj, tValOfObj, dt) => {
    collisions.dealDamage.call(obj, laser.power * dt * (1 - tValOfObj));
  },

  basicKineticCollision: (collider, collidee, dt) => {
    const LIMITINGSIZEFACTOR = 10;
    const objVel = [
      (collidee.velocityX) ? collidee.velocityX : 0,
      (collidee.velocityY) ? collidee.velocityY : 0,
    ];
    const velDiff = [collider.velocityX - objVel[0], collider.velocityY - objVel[1]];
    const magnitude = Math.sqrt((velDiff[0] * velDiff[0]) + (velDiff[1] * velDiff[1]));
    const damage = (dt * magnitude) / 200;

    const cldeRadius = collidee.destructible.radius;
    const cldrRadius = collider.destructible.radius;
    const cldeMaxHp = collidee.destructible.maxHp;
    const cldrMaxHp = collider.destructible.maxHp;
    const colliderSizeCoeff = (LIMITINGSIZEFACTOR * cldeRadius) / cldrRadius;
    const colliderDamage = utilities.clamp(0, damage * cldeMaxHp, colliderSizeCoeff * cldrMaxHp);
    collisions.dealDamage.call(collider, colliderDamage);

    const collideeSizeCoeff = (LIMITINGSIZEFACTOR * cldrRadius) / cldeRadius;
    const collideeDamage = utilities.clamp(0, damage * cldrMaxHp, collideeSizeCoeff * cldeMaxHp);
    collisions.dealDamage.call(collidee, collideeDamage);
  },

  targetingLaserCollision: (hitscan, obj) => {
    const ts = hitscan.owner.targetingSystem;
    for (let c = 0; c < ts.targets.length; c++) {
      if (ts.targets[c].obj === obj) { return; }
    }
    for (let c = 0; c < ts.lockedTargets.length; c++) {
      if (ts.lockedTargets[c] === obj) { return; }
    }
    ts.targets.push({ obj, timeAdded: Date.now() });
  },

  basicBlastwaveCollision: (radial, obj, dt) => {
    collisions.dealDamage.call(obj, radial.velocity * radial.collisionProperties.density * dt);
  },
};

module.exports = collisions;
