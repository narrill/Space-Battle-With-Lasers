const utilities = require('../utilities.js');
const missiles = require('../objBlueprints.js').missiles;

class Launcher {
  constructor(bp, owner) {
    this.owner = owner;
    this.firing = false;
    this.lastFireTime = 0;

    utilities.veryShallowObjectMerge.call(this, bp);

    const missile = missiles[this.missile];
    this.missile = (missile) ? missile : missiles.tomcat;
  }

  static getBP(params = {}) {
    return utilities.veryShallowUnionOverwrite.call({
      missile: 'tomcat',
      cd: 1
    }, params);
  }

  update() {
    if (this.firing) {
      const owner = this.owner;
      const launchee = utilities.deepObjectMerge.call({}, this.missile);
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

Launcher.isBuildable = true;

module.exports = Launcher;
