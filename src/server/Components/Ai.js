const utilities = require('../utilities.js');
const aiFunctions = require('../aiFunctions.js');

class Ai {
  constructor(bp, owner) {
    console.log(bp);
    this.owner = owner;
    utilities.veryShallowObjectMerge.call(this, bp);
  }

  update(dt) {
    const aiF = aiFunctions[this.aiFunction];
    aiF.call(this.owner, dt);
  }

  static getBP(params = {}) {
    console.log(params.aiFunction instanceof Object);
  	return utilities.veryShallowObjectMerge.call({
  		aiFunction: undefined
  	}, params);
  }
}

module.exports = Ai;
