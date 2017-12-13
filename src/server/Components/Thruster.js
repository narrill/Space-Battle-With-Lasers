const utilities = require('../utilities.js');

class Thruster {
  constructor(objectParams = {}) {
    this.currentStrength = 0;
    this.targetStrength = 0;
    this.maxStrength = 1000;
    this.efficiency = 1000;
    this.powerRampPercentage = 20;
    this.powerRampLimit = 6000;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update(dt) {
    let strength = this.targetStrength;
    this.targetStrength = 0; // clear target

    // clamp target strength to the thruster's max
    const maxStrength = this.maxStrength;
    strength = utilities.clamp(-maxStrength, strength, maxStrength);

    // lerp current thruster strength to target strength at the power ramp rate, 
    // then set current strength and the target strength to the lerped value
    let thrusterDelta = utilities.lerp(
      this.currentStrength,
      strength,
      this.powerRampPercentage * dt,
    ) - this.currentStrength;

    if (thrusterDelta * this.currentStrength >= 0) {
      thrusterDelta = utilities.clamp(
        (-this.powerRampLimit) * dt,
        thrusterDelta,
        this.powerRampLimit * dt,
      );
    } else {
      const toZero = Math.abs(this.currentStrength);
      thrusterDelta = utilities.clamp(
        -toZero,
        thrusterDelta,
        toZero
      );
    }

    this.currentStrength = utilities.clamp(
      -maxStrength,
      this.currentStrength + thrusterDelta,
      maxStrength,
    );
  }
}

module.exports = Thruster;
