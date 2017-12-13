const utilities = require('../utilities.js');

class Shield {
  constructor(objectParams = {}) {
    this.current = (objectParams.max) ? objectParams.max : 0;
    this.max = 0;
    this.efficiency = 0;
    this.recharge = 0;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Shield;
