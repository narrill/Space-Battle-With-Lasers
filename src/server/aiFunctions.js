// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/ships.js

const utilities = require('./utilities.js');

const has = Object.prototype.hasOwnProperty;

// Takes initial angular velocity, initial angular acceleration, constant angular jerk, and a t value
// Returns the change in orientation after t time has passed under the given constant angular jerk
const tripleIntegrateToDelta = (wo, ao, z, t) => {
  return (wo * t) + (0.5 * ao * t * t) + ((1 / 6) * z * t * t * t);
};

const doubleIntegrateToDelta = (ao, z, t) => {
  return (ao * t) + (.5 * z * t * t);
};

// Gets the time (as offset from present) and orientation at which the obj's velocity
// would hit 0 if it immediately began firing its rotational thruster fully against
// its current angular velocity
const getStopInfo = (obj) => {
  const prl = obj.thrusterSystem.rotational.powerRampLimit;
  const r = obj.destructible.radius;
  const mo = obj.momentOfInertia;
  const fo = obj.thrusterSystem.rotational.currentStrength;
  let wo = obj.rotationalVelocity;
  if(wo === 0)
    return {deltaTheta: 0, t: 0};
  const wSign = wo / Math.abs(wo);
  const ao = (fo * wSign <= 0) ? 0 : (fo * r) / mo; // Thrusters can drop to 0 immediately, so we should assume initial acceleration is 0
  // Angular jerk is assumed to be opposite angular velocity
  const z = (r / mo) * prl * (-wSign);
  // This is the quadratic formula - we need addition when w is negative and
  // subtraction when it's positive, hence wSign
  const t = ((-ao) - (wSign * Math.sqrt((ao * ao) - (2 * wo * z)))) / z;

  const thrusterMax = obj.thrusterSystem.rotational.maxStrength;
  const thrusterCurrent = obj.thrusterSystem.rotational.currentStrength;
  const thrusterSign = thrusterCurrent * wSign;
  const thrusterStart = (thrusterSign >= 0) ? 0 : Math.abs(thrusterCurrent);
  const thrusterT = (thrusterMax - thrusterCurrent) / prl;

  let theta;
  const thetao = obj.rotation;

  if(thrusterT < t) {
    const accelerationAtThrusterMax = (thrusterMax * r) / mo;
    theta = tripleIntegrateToDelta(wo, ao, z, thrusterT);
    wo = doubleIntegrateToDelta(ao, z, thrusterT);
    theta += doubleIntegrateToDelta(wo, accelerationAtThrusterMax, t - thrusterT);
  }
  else {
    theta = tripleIntegrateToDelta(wo, ao, z, t);
  }

  return {deltaTheta: theta, t};
};

const aiFunctions = {
  basic(dt) {
    let target;
    let lowestDistance = Number.MAX_VALUE;
    for (let c = 0; c < this.game.objs.length; c++) {
      const ship = this.game.objs[c];
      if (!(this.faction === ship.faction && this.faction !== -1)
        && this !== ship
        && !ship.owner) {
        const leftRoot = this.x - ship.x;
        const rightRoot = this.y - ship.y;
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
    const vectorToTarget = [target.x - this.x, target.y - this.y];
    const forwardVector = utilities.getForwardVector.call(this);
    const relativeAngleToTarget = utilities.angleBetweenVectors(
      forwardVector[0],
      forwardVector[1],
      vectorToTarget[0],
      vectorToTarget[1],
    );

    const stabRatio = this.stabilizer.thrustRatio;
    if(relativeAngleToTarget !== 0) {
      const wSign = relativeAngleToTarget / Math.abs(relativeAngleToTarget);
      const towardTarget = wSign * this.thrusterSystem.rotational.maxStrength;
      const awayTarget = -towardTarget;
      if(relativeAngleToTarget * this.rotationalVelocity <= 0) {
        this.objRotationalThrusters(awayTarget);
      }
      else {
        const stopInfo = getStopInfo(this);
        if(Math.abs(stopInfo.deltaTheta) < Math.abs(relativeAngleToTarget))
          this.objRotationalThrusters(awayTarget);
        else
          this.objRotationalThrusters(towardTarget);
      }
    }

    const distanceSqr = utilities.vectorMagnitudeSqr(vectorToTarget[0], vectorToTarget[1]);

    const myRange = (has.call(this, 'laser')) ? this.laser.range / 2 : 10000;

    if (relativeAngleToTarget < this.ai.fireSpread / 2
      && relativeAngleToTarget > (-this.ai.fireSpread) / 2) {
      if (distanceSqr < (myRange * myRange)
        && has.call(this, 'laser')) {
        this.objFireLaser();
      } else if (has.call(this, 'cannon')) {
        this.objFireCannon();
      } else if (has.call(this, 'launcher')) {
        this.objFireLauncher();
      }
    }

    if (distanceSqr > this.ai.followMax * this.ai.followMax || distanceSqr > myRange * myRange) {
      this.objMedialThrusters(
        this.thrusterSystem.medial.maxStrength / this.stabilizer.thrustRatio,
      );
    } else if (distanceSqr < this.ai.followMin * this.ai.followMin) {
      this.objMedialThrusters(
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
      this.objLateralThrusters(latMaxStrength / stabRatio);
    } else if (distanceSqr < 2 * (targetRange * targetRange)
      && relativeAngleToMe > -90
      && relativeAngleToMe < 0) {
      this.objLateralThrusters.call(this, -latMaxStrength / stabRatio);
    }

    this.objMedialStabilizers();
    this.objLateralStabilizers();
    this.objRotationalStabilizers();
  },

  basicGuidedMissile(dt) {
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
        this.objRotationalThrusters(
          (-relativeAngleToTarget) * this.thrusterSystem.rotational.maxStrength);
        return;
      }

      if (timeTillAligned < 0 || timeTillAligned < timeTillStop) {
        this.objRotationalThrusters(
          (rotVel / Math.abs(rotVel)) * rotMaxStrength * timeTillStop * 10,
        );
      } else if (timeTillAligned > timeTillStop) {
        this.objRotationalThrusters(
          (-(rotVel / Math.abs(rotVel))) * rotMaxStrength * timeTillStop * 10,
        );
      }

      this.objLateralThrusters(utilities.getLateralVelocity(this) * 1200 * dt);
      this.objMedialThrusters(this.thrusterSystem.medial.maxStrength);
    } else this.objMedialThrusters(this.thrusterSystem.medial.maxStrength);
  },

  basicDumbFireMissile() {
    const fetchInfo = this.game.spatialHash.boundedFetch(
      [this.x, this.y],
      this.ai.detonationRadius,
      { obj: [] },
    );
    let shouldDetonate = false;
    const objs = fetchInfo.obj;
    for (let c = 0; c < objs.length; c++) {
      const obj = objs[c];
      if (obj.id !== this.owner.id
        && obj.id !== this.id
        && (!obj.owner || obj.owner.id !== this.owner.id)) {
        shouldDetonate = true;
        break;
      }
    }
    if (shouldDetonate) { this.destructible.hp = 0; }
    this.objMedialThrusters(this.thrusterSystem.medial.maxStrength);
  },
};

module.exports = aiFunctions;
