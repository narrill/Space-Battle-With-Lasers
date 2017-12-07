const utilities = require('../utilities.js');
const id = require('../id.js');
const Thruster = require('./Thruster.js');

class ThrusterSystem {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.color = utilities.getRandomBrightColor();
    this.noiseLevel = 0;
    this.medial = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 1000,
      efficiency: 300,
    }, objectParams.medial));
    this.lateral = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 660,
      efficiency: 300,
    }, objectParams.lateral));
    this.rotational = new Thruster(utilities.deepObjectMerge.call({
      maxStrength: 250,
      efficiency: 100,
    }, objectParams.rotational));

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update(dt) {
    // add acceleration from each thruster
    const medial = this.medial;
    medial.update(dt);
    const fv = utilities.getForwardVector.call(this.owner);
    this.owner.accelerationX += fv[0] * medial.currentStrength;
    this.owner.accelerationY += fv[1] * medial.currentStrength;

    const lateral = this.lateral;
    lateral.update(dt);
    const rv = utilities.getRightVector.call(this.owner);
    this.owner.accelerationX += rv[0] * lateral.currentStrength;
    this.owner.accelerationY += rv[1] * lateral.currentStrength;

    const rotational = this.rotational;
    rotational.update(dt);
    this.owner.rotationalAcceleration -= rotational.currentStrength;
  }
}

module.exports = ThrusterSystem;
