const utilities = require('../utilities.js');
const id = require('../id.js');
const collisions = require('../collisions.js');

class TargetingSystem {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.targets = [];
    this.maxTargets = 1;
    this.range = 50000;
    this.lockConeWidth = 45;
    this.lockTime = 3;
    this.lockedTargets = [];

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update() {
    const owner = this.owner;
    const forwardVector = utilities.getForwardVector.call(owner);
    const rightVector = utilities.getRightVector.call(owner);
    const ts = this;
    // drop oldest targets if we have too many
    while (ts.targets.length > ts.maxTargets) {
      ts.targets.shift();
    }
    // if the angle to any of the targets is greater than the cone width 
    // or they are out of range, drop them
    for (let c = 0; c < ts.targets.length; c++) {
      const targetInfo = ts.targets[c];
      const target = targetInfo.obj;
      const vectorToTarget = [target.x - this.x, target.y - this.y];
      const vectorToRight = [
        vectorToTarget[0] + (rightVector[0] * target.destructible.radius),
        vectorToTarget[1] + (rightVector[1] * target.destructible.radius),
      ];
      const vectorToLeft = [
        vectorToTarget[0] - (rightVector[0] * target.destructible.radius),
        vectorToTarget[1] - (rightVector[1] * target.destructible.radius),
      ];
      const relativeAngleToRight = utilities.angleBetweenVectors(
        forwardVector[0],
        forwardVector[1],
        vectorToRight[0],
        vectorToRight[1],
      );
      const relativeAngleToLeft = utilities.angleBetweenVectors(
        forwardVector[0],
        forwardVector[1],
        vectorToLeft[0],
        vectorToLeft[1],
      );
      const outsideCone = Math.abs(relativeAngleToRight) > ts.lockConeWidth / 2
        && Math.abs(relativeAngleToLeft) > ts.lockConeWidth / 2
        && relativeAngleToLeft * relativeAngleToRight > 0;
      const vtt0Sq = vectorToTarget[0] * vectorToTarget[0];
      const vtt1Sq = vectorToTarget[1] * vectorToTarget[1];
      const rangeToTarget = vtt0Sq + vtt1Sq;
      const rangePlusRadius = ts.range + target.destructible.radius;
      const outsideRange = rangeToTarget > rangePlusRadius * rangePlusRadius;
      if (outsideCone || outsideRange) {
        ts.targets.splice(c--, 1);
      } else if (Date.now() > targetInfo.timeAdded + (ts.lockTime * 1000)) {
        ts.lockedTargets.push(target);
        ts.targets.splice(c--, 1);
      }
    }
    // if any locked targets are out of range, drop them
    for (let c = 0; c < ts.lockedTargets.length; c++) {
      const target = ts.lockedTargets[c];
      if (utilities.distanceSqr(
        [owner.x, owner.y],
        [target.x, target.y],
      ) > (ts.range + target.destructible.radius) * (ts.range + target.destructible.radius)) {
        ts.lockedTargets.splice(c--, 1);
      }
    }
    // drop oldest locked targets if we have too many
    while (ts.lockedTargets.length > ts.maxTargets) {
      ts.lockedTargets.shift();
    }

    if (ts.firing) {
      const rangeVector = [forwardVector[0] * ts.range, forwardVector[1] * ts.range];
      owner.game.createHitscan(
        owner.game,
        owner.x + (forwardVector[0] * 30),
        owner.y + (forwardVector[1] * 30),
        owner.x + rangeVector[0],
        owner.y + rangeVector[1],
        'rgb(255,0,0)',
        owner,
        collisions.targetingLaserCollision, {},
        this.id,
      );
      ts.firing = false;
    }
  }
}

module.exports = TargetingSystem;
