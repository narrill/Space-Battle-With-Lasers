// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/ships.js

const utilities = require('./utilities.js');
const objControls = require('./objControls.js');

const has = Object.prototype.hasOwnProperty;

const aiFunctions = {
  basic(dt) {
    let target;
    let lowestDistance = Number.MAX_VALUE;
    for (let c = 0; c < this.game.otherShips.length; c++) {
      const ship = this.game.otherShips[c];
      if (!(this.faction === ship.faction && this.faction !== -1) || this !== ship) {
        const leftRoot = this.x * ship.x;
        const rightRoot = this.y * ship.y;
        const distanceSqr = (leftRoot * leftRoot) + (rightRoot * rightRoot);
        if (distanceSqr < lowestDistance) {
          target = ship;
          lowestDistance = distanceSqr;
        }
      }
    }

    if (!target) {
      return;
    }
    // console.log(cVal+' '+this.faction);
    const vectorToTarget = [target.x - this.x, target.y - this.y];
    const forwardVector = utilities.getForwardVector.call(this);
    const relativeAngleToTarget = utilities.angleBetweenVectors(
      forwardVector[0],
      forwardVector[1],
      vectorToTarget[0],
      vectorToTarget[1],
    );

    const rotMaxStrength = this.thrusterSystem.rotational.maxStrength;
    const stabRatio = this.stabilizer.thrustRatio;
    if (relativeAngleToTarget > 0) {
      objControls.objRotationalThrusters.call(
        this,
        ((-relativeAngleToTarget) * dt * this.ai.accuracy * rotMaxStrength) / stabRatio,
      );
    } else if (relativeAngleToTarget < 0) {
      objControls.objRotationalThrusters.call(
        this,
        ((relativeAngleToTarget) * dt * this.ai.accuracy * -rotMaxStrength) / stabRatio,
      );
    }

    const distanceSqr = utilities.vectorMagnitudeSqr(vectorToTarget[0], vectorToTarget[1]);

    const myRange = (has.call(this, 'laser')) ? this.laser.range : 10000;

    if (relativeAngleToTarget < this.ai.fireSpread / 2
      && relativeAngleToTarget > (-this.ai.fireSpread) / 2) {
      if (distanceSqr < (myRange * myRange)
        && has.call(this, 'laser')) {
        objControls.objFireLaser.call(this);
      } else if (has.call(this, 'cannon')) {
        objControls.objFireCannon.call(this);
      }
    }

    if (distanceSqr > this.ai.followMax * this.ai.followMax) {
      objControls.objMedialThrusters.call(
        this,
        this.thrusterSystem.medial.maxStrength / this.stabilizer.thrustRatio,
      );
    } else if (distanceSqr < this.ai.followMin * this.ai.followMin) {
      objControls.objMedialThrusters.call(
        this,
        (-this.thrusterSystem.medial.maxStrength) / this.stabilizer.thrustRatio,
      );
    }

    const vectorFromTarget = [-vectorToTarget[0], -vectorToTarget[1]];
    const relativeAngleToMe = utilities.angleBetweenVectors(
      target.forwardVectorX,
      target.forwardVectorY,
      vectorFromTarget[0],
      vectorFromTarget[1],
    );
    // console.log(Math.floor(relativeAngleToMe));

    const targetRange = (has.call(target, 'laser')) ? target.laser.range : 10000;

    const latMaxStrength = this.thrusterSystem.lateral.maxStrength;
    if (distanceSqr < 2 * (targetRange * targetRange)
      && relativeAngleToMe < 90
      && relativeAngleToMe > 0) {
      objControls.objLateralThrusters.call(this, latMaxStrength / stabRatio);
    } else if (distanceSqr < 2 * (targetRange * targetRange)
      && relativeAngleToMe > -90
      && relativeAngleToMe < 0) {
      objControls.objLateralThrusters.call(this, -latMaxStrength / stabRatio);
    }

    objControls.objMedialStabilizers.call(this, dt);
    objControls.objLateralStabilizers.call(this, dt);
    objControls.objRotationalStabilizers.call(this, dt);
  },

  basicMissile(dt) {
    const target = (this.ai.specialProperties) ? this.ai.specialProperties.target : undefined;
    if (target) {
      const vectorToTarget = (target.velocityX && target.velocityY)
        ? [
          (target.x - this.x) + (target.velocityX * 0.5),
          (target.y - this.y) + (target.velocityY * 0.5),
        ]
        : [target.x - this.x, target.y - this.y];
      const detRadius = this.ai.detonationRadius;
      const tDestRadius = target.destructible.radius;
      const oDestRadius = this.destructible.radius;
      const radiiSum = detRadius + tDestRadius + oDestRadius;
      if ((vectorToTarget[0] * vectorToTarget[0]) + (vectorToTarget[1] * vectorToTarget[1])
        < radiiSum * radiiSum) {
        this.destructible.hp = 0;
      }
      const forwardVector = utilities.getForwardVector(this);
      const relativeAngleToTarget = utilities.angleBetweenVectors(
        forwardVector[0],
        forwardVector[1],
        vectorToTarget[0],
        vectorToTarget[1],
      );
      const rotVel = this.rotationalVelocity;
      const rotMaxStrength = this.thrusterSystem.rotational.maxStrength;
      const timeTillAligned = relativeAngleToTarget / rotVel;
      const timeTillStop = Math.abs(rotVel / rotMaxStrength);

      if (this.rotationalVelocity === 0) {
        objControls.objRotationalThrusters.call(
          this,
          (-relativeAngleToTarget) * this.thrusterSystem.rotational.maxStrength);
        return;
      }

      if (timeTillAligned < 0 || timeTillAligned < timeTillStop) {
        objControls.objRotationalThrusters.call(
          this,
          (rotVel / Math.abs(rotVel)) * rotMaxStrength * timeTillStop * 10,
        );
      } else if (timeTillAligned > timeTillStop) {
        objControls.objRotationalThrusters.call(
          this,
          (-(rotVel / Math.abs(rotVel))) * rotMaxStrength * timeTillStop * 10,
        );
      }

      objControls.objLateralThrusters.call(this, utilities.getLateralVelocity(this) * 1200 * dt);
      objControls.objMedialThrusters.call(this, this.thrusterSystem.medial.maxStrength);

      // objControls.objLateralStabilizers(obj, dt);
    } else objControls.objMedialThrusters.call(this, this.thrusterSystem.medial.maxStrength);
  },
};

module.exports = aiFunctions;
