// Heavily adapated from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/objControls.js

const utilities = require('./utilities.js');

const objControls = {
  // add given strength to main thruster
  objMedialThrusters(strength) {
    this.thrusterSystem.medial.targetStrength += strength;
  },

  // add strength to side thruster
  objRotationalThrusters(strength) {
    this.thrusterSystem.rotational.targetStrength += strength;
  },

  // add strength to lateral thruster
  objLateralThrusters(strength) {
    this.thrusterSystem.lateral.targetStrength += strength;
  },

  // rotational stabilizer
  objRotationalStabilizers(dt) {
    if (!this.stabilizer) { return; }

    if (this.thrusterSystem.rotational.targetStrength * this.rotationalVelocity >= -10
      && Math.abs(this.rotationalVelocity) > this.stabilizer.precision / 6) {
      objControls.objRotationalThrusters.call(
        this,
        this.rotationalVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(this.rotationalVelocity) >= this.stabilizer.clamps.rotational
      && this.thrusterSystem.rotational.targetStrength * this.rotationalVelocity < 0) {
      this.thrusterSystem.rotational.targetStrength = 0;
    }
  },

  // medial stabilizer
  objMedialStabilizers(dt) {
    if (!this.stabilizer) { return; }

    const medialVelocity = utilities.getMedialVelocity.call(this);

    if (this.thrusterSystem.medial.targetStrength * medialVelocity >= 0
      && Math.abs(medialVelocity) > this.stabilizer.precision) {
      objControls.objMedialThrusters.call(
        this,
        medialVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(medialVelocity) >= this.stabilizer.clamps.medial
      && this.thrusterSystem.medial.targetStrength * medialVelocity < 0) {
      this.thrusterSystem.medial.targetStrength = 0;
    }
  },

  // lateral stabilizer
  objLateralStabilizers(dt) {
    if (!this.stabilizer) { return; }
    // see above
    const lateralVelocity = utilities.getLateralVelocity.call(this);
    if (this.thrusterSystem.lateral.targetStrength * lateralVelocity >= 0
      && Math.abs(lateralVelocity) > this.stabilizer.precision) {
      objControls.objLateralThrusters.call(
        this,
        lateralVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(lateralVelocity) >= this.stabilizer.clamps.lateral
      && this.thrusterSystem.lateral.targetStrength * lateralVelocity < 0) {
      this.thrusterSystem.lateral.targetStrength = 0;
    }
  },

  objFireLaser() {
    if (!this.laser) { return; }
    const now = this.game.elapsedGameTime;
    // if the cool down is up
    if (now > this.laser.lastFireTime + (this.laser.cd * 1000)) {
      this.laser.lastFireTime = now;
      this.laser.currentPower = this.laser.maxPower;
    }
  },

  objFireCannon() {
    if (!this.cannon) { return; }
    const now = this.game.elapsedGameTime;
    if (now > this.cannon.lastFireTime + (this.cannon.cd * 1000)) {
      this.cannon.lastFireTime = now;
      this.cannon.firing = true;
    }
  },

  objFireLauncher() {
    if (!this.launcher) { return; }
    const now = this.game.elapsedGameTime;
    if (now > this.launcher.lastFireTime + (this.launcher.cd * 1000)) {
      this.launcher.lastFireTime = now;
      this.launcher.firing = true;
    }
  },

  objFireTargetingSystem() {
    if (!this.targetingSystem) { return; }
    this.targetingSystem.firing = true;
  },
};

module.exports = objControls;
