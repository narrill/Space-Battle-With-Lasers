const utilities = require('../utilities.js');
const id = require('../id.js');

class Warhead {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.radial = utilities.deepObjectMerge.call({
      velocity: 6000,
      decay: 12,
      color: 'red',
      collisionProperties: {
        density: 8,
      },
      collisionFunction: 'basicBlastwaveCollision',
    }, objectParams.radial);
  }
}

module.exports = Warhead;