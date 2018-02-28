const utilities = require('../utilities.js');
const collisions = require('../collisions.js');

class Warhead {
  constructor(bp, owner) {
    this.owner = owner;
    this.radial = bp.radial;
  }

  static getBP(params = {}) {
    return {
      radial: utilities.deepUnionOverwrite.call({
        velocity: 6000,
        decay: 0.2,
        color: { r: 255, g: 0, b: 0 },
        collisionProperties: {
          density: 2,
        },
        collisionFunction: 'basicBlastwaveCollision',
      }, params.radial),
    };
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
