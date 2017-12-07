const has = Object.prototype.hasOwnProperty;

class Mobile {
  update(dt) {
    // accelerate
    if (has.call(this, 'accelerationX') && has.call(this, 'accelerationY')) {
      this.velocityX += this.accelerationX * dt;
      this.accelerationX = 0;
      this.velocityY += this.accelerationY * dt;
      this.accelerationY = 0;
      if (has.call(this, 'rotationalVelocity') && has.call(this, 'rotationalAcceleration')) {
        this.rotationalVelocity += this.rotationalAcceleration * dt;
        this.rotationalAcceleration = 0;
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
