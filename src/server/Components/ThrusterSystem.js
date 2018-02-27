const utilities = require('../utilities.js');
const Thruster = require('./Thruster.js');

class ThrusterSystem {
  constructor(bp, owner) {
    this.owner = owner;
    this.color = utilities.getRandomBrightColor();
    this.medial = new Thruster(bp.medial);
    this.lateral = new Thruster(bp.lateral);
    this.rotational = new Thruster(bp.rotational);
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      medial: Thruster.getBP(utilities.deepObjectMerge.call({
        maxStrength: 1000,
        efficiency: 3000,
      }, params.medial)),
      lateral: Thruster.getBP(utilities.deepObjectMerge.call({
        maxStrength: 660,
        efficiency: 3000,
      }, params.lateral)),
      rotational: Thruster.getBP(utilities.deepObjectMerge.call({
        maxStrength: 250,
        efficiency: 1000,
      }, params.rotational))
    }, params);
  }

  update(dt) {
    // add acceleration from each thruster
    const medial = this.medial;
    medial.update(dt);
    const fv = utilities.getForwardVector.call(this.owner);
    this.owner.forceX += fv[0] * medial.currentStrength;
    this.owner.forceY += fv[1] * medial.currentStrength;

    const lateral = this.lateral;
    lateral.update(dt);
    const rv = utilities.getRightVector.call(this.owner);
    this.owner.forceX += rv[0] * lateral.currentStrength;
    this.owner.forceY += rv[1] * lateral.currentStrength;

    const rotational = this.rotational;
    rotational.update(dt);
    this.owner.rotationalForce -= rotational.currentStrength;
  }
}

module.exports = ThrusterSystem;
