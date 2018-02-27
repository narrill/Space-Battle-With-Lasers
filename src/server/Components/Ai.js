const utilities = require('../utilities.js');
const aiFunctions = require('../aiFunctions.js');

class Ai {
  constructor(bp, owner) {
    this.owner = owner;
    utilities.veryShallowObjectMerge.call(this, bp);
  }

  update(dt) {
    const aiF = aiFunctions[this.aiFunction];
    aiF.call(this.owner, dt);
  }

  static getBP(params = {}) {
  	return utilities.veryShallowUnionOverwrite.call({
  		aiFunction: undefined
  	}, params);
  }
}

module.exports = Ai;
