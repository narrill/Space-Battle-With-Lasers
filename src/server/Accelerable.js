const Mobile = require('./Mobile.js');
const utilities = require('./utilities.js');

class Accelerable extends Mobile {
  update(dt) {
    const mass = this.mass;
    this.velocityX += (this.forceX / mass) * dt;
    this.forceX = 0;
    this.velocityY += (this.forceY / mass) * dt;
    this.forceY = 0;
    const torque = this.rotationalForce * this.destructible.radius;
    const angularAcceleration = torque / this.momentOfInertia;
    this.rotation = utilities.correctOrientation(this.rotation + (this.rotationalVelocity * dt) + ((angularAcceleration *dt * dt) / 2));
    this.rotationalVelocity += angularAcceleration * dt;        
    this.rotationalForce = 0;

    super.update(dt);
  }
}

module.exports = Accelerable;