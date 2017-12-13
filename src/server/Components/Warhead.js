const utilities = require('../utilities.js');
const collisions = require('../collisions.js');

class Warhead {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.radial = utilities.deepObjectMerge.call({
      velocity: 6000,
      decay: .2,
      color: new utilities.ColorRGB({ r: 255, g: 0, b: 0 }),
      collisionProperties: {
        density: 2,
      },
      collisionFunction: 'basicBlastwaveCollision',
    }, objectParams.radial);
  }

  destroy() {
    const owner = this.owner;
    const radial = this.radial;
    owner.game.createRadial(
      owner.game,
      owner.x,
      owner.y,
      radial.velocity,
      radial.decay,
      radial.color,
      owner,
      collisions[radial.collisionFunction],
      radial.collisionProperties,
    );
  }
}

module.exports = Warhead;
