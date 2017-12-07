const utilities = require('../utilities.js');
const id = require('../id.js');
const missiles = require('../missiles.js');

class Launcher {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
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

  update() {
    if (this.firing) {
      const owner = this.owner;
      const launchee = utilities.deepObjectMerge.call({}, this.tubes[0].ammo);
      launchee.x = owner.x;
      launchee.y = owner.y;
      launchee.velocityX = owner.velocityX;
      launchee.velocityY = owner.velocityY;
      launchee.rotation = owner.rotation;
      launchee.color = owner.color;
      launchee.specialProperties = { owner };
      if (owner.targetingSystem && owner.targetingSystem.lockedTargets.length > 0 && launchee.ai) {
        launchee.ai.specialProperties = {
          target: owner.targetingSystem.lockedTargets[0],
        };
      }
      owner.game.createObj(launchee, owner.game);
      this.firing = false;
    }
  }
}

module.exports = Launcher;
