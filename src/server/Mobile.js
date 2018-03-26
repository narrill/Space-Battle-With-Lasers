const Vec2 = require('./Vec2.js');
const utilities = require('./utilities.js');

class Mobile {
  constructor({ 
    position = new Vec2(), 
    velocity = new Vec2(), 
    rotation = 0, 
    angularVelocity = 0 
  }) {
    this.position = position;
    this.velocity = velocity;
    this.rotation = rotation;
    this.angularVelocity = angularVelocity;
    this.previousPosition = position;

    this._resetTemporaryValues();
  }

  _resetTemporaryValues() {
    this._forwardVector = undefined;
    this._rightVector = undefined;
    this._medialVelocity = undefined;
    this._lateralVelocity = undefined;
  }

  update(dt) {
    this.previousPosition = this.position.copy();
    this.position.addInPlace(this.velocity.scale(dt));
    this.rotation = utilities.correctOrientation(this.rotation + this.angularVelocity * dt);
    this._resetTemporaryValues();    
  }

  get forwardVector() {
    if(!this._forwardVector) {
      this._forwardVector = Vec2.FORWARD.rotateD(-this.rotation);
    }

    return this._forwardVector;
  },

  get rightVector() {
    if(!this._rightVector)
      this._rightVector = Vec2.FORWARD.rotateD(-this.rotation + 90);

    return this._rightVector;
  },

  get medialVelocity() {
    if(!this._medialVelocity)
      this._medialVelocity = this.velocity.scalarProjectOnto(this.forwardVector)
    return this._medialVelocity;
  },

  get lateralVelocity() {
    if (!this._lateralVelocity) 
      this._lateralVelocity = this.velocity.scalarProjectOnto(this.rightVector);
    return this._lateralVelocity;
  },
}

module.exports = Mobile;
