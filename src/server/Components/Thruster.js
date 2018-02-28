const utilities = require('../utilities.js');

class Thruster {
  constructor(bp) {
    this.currentStrength = 0;
    this.targetStrength = 0;

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      maxStrength: 1000,
      efficiency: 1000,
      powerRampPercentage: 20,
      powerRampLimit: 6000,
    }, params);
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
        toZero,
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
