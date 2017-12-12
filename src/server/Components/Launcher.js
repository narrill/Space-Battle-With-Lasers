const utilities = require('../utilities.js');
const id = require('../id.js');
const missiles = require('../objBlueprints.js').missiles;

class Launcher {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.tubes = [
      { ammo: missiles.tomcat, lastFireTime: 0 },
    ];
    this.firing = false;
    this.cd = 1;
    this.fireInterval = 0.1;
    this.lastFireTime = 0;

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update() {
    if (this.firing) {
      const owner = this.owner;
      const launchee = utilities.deepObjectMerge.call({}, this.tubes[0].ammo);
      const weaponPoint = this.owner.weaponPoint;
      launchee.x = owner.x + weaponPoint[0];
      launchee.y = owner.y + weaponPoint[1];
      launchee.velocityX = owner.velocityX;
      launchee.velocityY = owner.velocityY;
      launchee.rotation = owner.rotation;
      launchee.color = owner.color;
      launchee.specialProperties = { owner };
      owner.game.createObj(launchee, owner.game, owner);
      this.firing = false;
    }
  }
}

module.exports = Launcher;
