class Mobile {
  update(dt) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
    this.medialVelocity = undefined;
    this.lateralVelocity = undefined;
  }
}

module.exports = Mobile;
