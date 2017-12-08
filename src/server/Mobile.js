const has = Object.prototype.hasOwnProperty;

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
        this.rotationalVelocity += (this.rotationalForce / mass) * dt;
        this.rotationalForce = 0;
      }
      this.medialVelocity = undefined;
      this.lateralVelocity = undefined;
    }

    // move
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    if (has.call(this, 'rotation')) {
      this.rotation += this.rotationalVelocity * dt;
      if (this.rotation > 180) {
        this.rotation -= 360;
      } else if (this.rotation < -180) {
        this.rotation += 360;
      }
    }

    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
  }
}

module.exports = Mobile;
