const utilities = require('../utilities.js');
const id = require('../id.js');
const missiles = require('../missiles.js');

class Launcher {
  constructor(objectParams = {}) {
    this.id = id.takeIdTag();
    this.tubes = [
      { ammo: missiles.tomcat, lastFireTime: 0 },
    ];
    this.firing = false;
    this.cd = 4;
    this.fireInterval = 0.1;
    this.lastFireTime = 0;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }
}

module.exports = Launcher;