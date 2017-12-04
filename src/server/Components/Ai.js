const utilities = require('../utilities.js');
const id = require('../id.js');

class Ai {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.aiFunction = undefined;
    
    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Ai;