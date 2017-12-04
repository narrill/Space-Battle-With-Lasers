const dependencyCatch = require('../dependencyCatch.js');
const constructors = dependencyCatch(require('../constructors.js'));
const utilities = require('../utilities.js');
const id = require('../id.js');

class Destructible {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.hp = 500;
    this.maxHp = (objectParams.hp) ? objectParams.hp : 500;
    this.radius = 500;
    this.shield = constructors.createComponentDestructibleShield(
      utilities.deepObjectMerge.call({}, objectParams.shield)
    );

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Destructible;