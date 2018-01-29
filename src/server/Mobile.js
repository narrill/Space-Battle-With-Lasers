const has = Object.prototype.hasOwnProperty;
const utilities = require('./utilities.js');

class Mobile {
  update(dt) {
    // accelerate
    if (has.call(this, 'forceX') && has.call(this, 'forceY')) {
      const mass = this.mass;
      this.velocityX += (this.forceX / mass) * dt;
      this.forceX = 0;
      this.velocityY += (this.forceY / mass) * dt;
      this.forceY = 0;
      if (has.call(this, 'rotationalVelocity') && has.call(this, 'rotationalForce')) {
        const torque = this.rotationalForce * this.destructible.radius;
        const angularAcceleration = torque / this.momentOfInertia;
        this.rotation = utilities.correctOrientation(this.rotation + (this.rotationalVelocity * dt) + ((angularAcceleration *dt * dt) / 2));
        this.rotationalVelocity += angularAcceleration * dt;        
        this.rotationalForce = 0;
      }
      this.medialVelocity = undefined;
      this.lateralVelocity = undefined;
    }

    // move
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
  }
}

module.exports = Mobile;
