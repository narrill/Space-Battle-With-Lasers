const utilities = require('../utilities.js');
const enums = require('../enums.js');

const has = Object.prototype.hasOwnProperty;

class PowerSystem {
  constructor(bp, owner) {
    this.owner = owner;
    this.current = [0, 0, 0];
    this.target = [0, 0, 0];

    utilities.veryShallowObjectMerge.call(this, bp);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite({
      transferRate: 6
    }, params);
  }

  update(dt) {
    // Scales target values of the given power system such that they sum to 1
    // Expects to be bound to the power system object
    const scalePowerTarget = () => {
      let sum = 0;
      for (let c = 0; c < this.target.length; c++) {
        sum += this.target[c];
      }
      if (sum === 0) {
        this.target = [0, 0, 0];
        return;
      }
      for (let c = 0; c < this.target.length; c++) { this.target[c] = this.target[c] / sum; }
    };

    const owner = this.owner;

    // update power system
    // scale all relevant values down from the augmented 
    // to their normal using the old power values
    let thrusterPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.THRUSTERS);
    let laserPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.LASERS);
    let shieldPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.SHIELDS);
    // thrusters
    owner.thrusterSystem.medial.maxStrength /= (1 + thrusterPower);
    owner.thrusterSystem.lateral.maxStrength /= (1 + thrusterPower);
    owner.thrusterSystem.rotational.maxStrength /= (1 + thrusterPower);
    owner.stabilizer.clamps.medial /= (1 + thrusterPower);
    owner.stabilizer.clamps.lateral /= (1 + thrusterPower);
    owner.stabilizer.clamps.rotational /= (1 + thrusterPower);
    // lasers
    if (has.call(owner, 'laser')) { owner.laser.maxPower /= (1 + laserPower); }
    if (has.call(owner, 'cannon')) { owner.cannon.power /= (1 + laserPower); }
    // shields
    owner.destructible.shield.current /= (1 + shieldPower);
    owner.destructible.shield.max /= (1 + shieldPower);
    owner.destructible.shield.recharge /= (1 + shieldPower);

    // update the power values
    scalePowerTarget();
    this.current = utilities.lerpNd(
      this.current,
      this.target,
      this.transferRate * dt,
    );

    // clear power target
    for (let c = 0; c < this.target.length; c++) {
      this.target[c] = 0;
    }

    // scale back up to augmented with the new power values
    thrusterPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.THRUSTERS);
    laserPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.LASERS);
    shieldPower = this.getPowerForComponent(enums.SHIP_COMPONENTS.SHIELDS);
    // thrusters
    owner.thrusterSystem.medial.maxStrength *= (1 + thrusterPower);
    owner.thrusterSystem.lateral.maxStrength *= (1 + thrusterPower);
    owner.thrusterSystem.rotational.maxStrength *= (1 + thrusterPower);
    owner.stabilizer.clamps.medial *= (1 + thrusterPower);
    owner.stabilizer.clamps.lateral *= (1 + thrusterPower);
    owner.stabilizer.clamps.rotational *= (1 + thrusterPower);
    // lasers
    if (has.call(owner, 'laser')) { owner.laser.maxPower *= (1 + laserPower); }
    if (has.call(owner, 'cannon')) { owner.cannon.power *= (1 + laserPower); }
    // shields
    owner.destructible.shield.current *= (1 + shieldPower);
    owner.destructible.shield.max *= (1 + shieldPower);
    owner.destructible.shield.recharge *= (1 + shieldPower);
  }

  getPowerForComponent(component) {
    if (component >= this.current.length || component < 0) { return 0; }
    const components = this.current.length;
    // this is the transformation function
    return utilities.clamp(
      0,
      (this.current[component] - (1 / components)) / (2 * (1 / components)),
      1,
    );
  }
}

module.exports = PowerSystem;
