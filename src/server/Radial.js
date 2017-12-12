const id = require('./id.js');
const NetworkRadial = require('./NetworkRadial.js');

class Radial {
  constructor(game, x, y, vel, decay, color, owner, collisionFunction, collisionProperties) {
    this.id = id.takeIdTag();
    this.game = game;
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.initialVelocity = vel;
    this.velocity = vel;
    this.decay = decay;
    this.color = color;
    this.owner = owner;
    this.collisionFunction = collisionFunction;
    this.collisionProperties = collisionProperties;
    this.type = 'radial';
  }

  update(dt) {
    this.radius += this.velocity * dt;
    this.velocity -= this.initialVelocity * (dt / this.decay);
    this.game.reportQueue.push(this);
  }

  get shouldDestroy() {
    return this.velocity <= 0;
  }

  destroy() {
    id.returnIdTag(this.id);
  }

  get networkRepresentation() {
    return new NetworkRadial(this);
  }
}

module.exports = Radial;