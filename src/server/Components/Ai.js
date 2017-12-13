const utilities = require('../utilities.js');
const aiFunctions = require('../aiFunctions.js');

class Ai {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.aiFunction = undefined;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update(dt) {
    const aiF = aiFunctions[this.aiFunction];
    aiF.call(this.owner, dt);
  }
}

module.exports = Ai;
