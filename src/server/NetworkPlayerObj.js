const enums = require('./enums.js');

class NetworkPlayerObj {
  constructor(obj) {
    const stab = obj.stabilizer;
    const ps = obj.powerSystem;
    this.x = obj.x;
    this.y = obj.y;
    this.velX = obj.velocityX;
    this.velY = obj.velocityY;
    this.rotation = obj.rotation;
    this.rotationalVelocity = obj.rotationalVelocity;
    this.clampMedial = stab.clamps.medial;
    this.clampLateral = stab.clamps.lateral;
    this.clampRotational = stab.clamps.rotational;
    this.clampsEnabled = stab.clamps.enabled;
    this.stabilized = stab.enabled;
    this.thrusterPower = ps.getPowerForComponent(
      enums.SHIP_COMPONENTS.THRUSTERS,
    );
    this.weaponPower = ps.getPowerForComponent(
      enums.SHIP_COMPONENTS.LASERS,
    );
    this.shieldPower = ps.getPowerForComponent(
      enums.SHIP_COMPONENTS.SHIELDS,
    );
  }
}

module.exports = NetworkPlayerObj;