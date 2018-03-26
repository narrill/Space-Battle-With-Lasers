const Mobile = require('./Mobile.js');
const Vec2 = require('./Vec2.js');
const utilities = require('./utilities.js');

class Accelerable extends Mobile {
  constructor(...args) {
    super(...args);
    this.force = new Vec2();
    this.angularForce = 0;
  }
  update(dt) {
    const mass = this.mass;

    this.velocity.addInPlace(this.force.scaleInPlace(dt / mass));
    this.force.reset();
    
    const torque = this.angularForce * this.destructible.radius;
    const angularAcceleration = torque / this.momentOfInertia;
    this.rotationalVelocity += angularAcceleration * dt;
    this.rotationalForce = 0;

    super.update(dt);
  }
}

module.exports = Accelerable;
