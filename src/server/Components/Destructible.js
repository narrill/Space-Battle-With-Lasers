const utilities = require('../utilities.js');
const id = require('../id.js');
const Shield = require('./Shield.js');

class Destructible {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.hp = 500;
    this.maxHp = (objectParams.hp) ? objectParams.hp : 500;
    this.radius = 500;
    this.shield = new Shield(
      utilities.deepObjectMerge.call({}, objectParams.shield),
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Destructible;
