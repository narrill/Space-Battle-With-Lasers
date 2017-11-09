module.exports = {};

const dependencyCatch = require('./dependencyCatch.js');
const utilities = require('./utilities.js');
const constructors = dependencyCatch(require('./constructors.js'));
const collisions = require('./collisions.js');
const enums = require('./enums.js');
const objControls = require('./objControls.js');
const aiFunctions = require('./aiFunctions.js');
const destructors = require('./destructors.js');
const gameFunctions = dependencyCatch(require('./gameFunctions.js'));
const keys = require('./keys.js');
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/updaters.js

const myKeys = keys.myKeys;
const myMouse = keys.myMouse;

const has = Object.prototype.hasOwnProperty;

const updaters = {
  updateRadial(dt) {
    this.radius += this.velocity * dt;
    this.velocity -= this.velocity * this.decay * dt;
  },
  updateThrusterSystemComponent(dt) {
    function updateThruster(deltaT) {
      let strength = this.targetStrength;
      this.targetStrength = 0; // clear target

      // clamp target strength to the thruster's max
      const maxStrength = this.maxStrength;
      strength = utilities.clamp(-maxStrength, strength, maxStrength);

      // lerp current thruster strength to target strength at the power ramp rate, 
      // then set current strength and the target strength to the lerped value
      let thrusterDelta = utilities.lerp(
        this.currentStrength,
        strength,
        this.powerRampPercentage * deltaT,
      ) - this.currentStrength;

      if (thrusterDelta * this.currentStrength > 0) {
        thrusterDelta = utilities.clamp(
          (-this.powerRampLimit) * deltaT,
          thrusterDelta,
          this.powerRampLimit * deltaT,
        );
      }

      this.currentStrength = utilities.clamp(
        -maxStrength,
        this.currentStrength + thrusterDelta,
        maxStrength,
      );
    }
    // add acceleration from each thruster
    const medial = this.thrusterSystem.medial;
    updateThruster.call(medial, dt, true);
    // console.log(`update`);
    // console.log(this);
    const fv = utilities.getForwardVector.call(this);
    // console.log(fv);
    this.accelerationX += fv[0] * medial.currentStrength;
    this.accelerationY += fv[1] * medial.currentStrength;

    const lateral = this.thrusterSystem.lateral;
    updateThruster.call(lateral, dt);
    const rv = utilities.getRightVector.call(this);
    this.accelerationX += rv[0] * lateral.currentStrength;
    this.accelerationY += rv[1] * lateral.currentStrength;

    const rotational = this.thrusterSystem.rotational;
    updateThruster.call(rotational, dt);
    // console.log(rotational.currentStrength);
    // console.log(this.rotation);
    this.rotationalAcceleration -= rotational.currentStrength;
  },

  updateMobile(dt) {
    // accelerate
    if (has.call(this, 'accelerationX') && has.call(this, 'accelerationY')) {
      this.velocityX += this.accelerationX * dt;
      this.accelerationX = 0;
      this.velocityY += this.accelerationY * dt;
      this.accelerationY = 0;
      if (has.call(this, 'rotationalVelocity') && has.call(this, 'rotationalAcceleration')) {
        this.rotationalVelocity += this.rotationalAcceleration * dt;
        // console.log(this.rotationalAcceleration);
        this.rotationalAcceleration = 0;
      }
      this.medialVelocity = undefined;
      this.lateralVelocity = undefined;
    }

    // move
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    if (has.call(this, 'rotation')) {
      this.rotation += this.rotationalVelocity * dt;
      if (this.rotation > 180) {
        this.rotation -= 360;
      } else if (this.rotation < -180) {
        this.rotation += 360;
      }
    }
    // console.log(this.x);
    // console.log(this.velocityX);
    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
  },

  updateLaserComponent(dt) {
    const forwardVector = utilities.getForwardVector.call(this);
    // create laser objects
    const spread = (Math.random() * this.laser.spread) - (this.laser.spread / 2);
    const laserVector = [0, -this.laser.range];
    const currentLaserVector = utilities.rotate(
      0,
      0,
      laserVector[0],
      laserVector[1],
      (-this.rotation) + spread,
    );
    if (this.laser.currentPower > 0) {
      constructors.createHitscan(
        this.game,
        this.x + (forwardVector[0] * 30),
        this.y + (forwardVector[1] * 30),
        this.x + currentLaserVector[0],
        this.y + currentLaserVector[1],
        this.laser.color,
        this,
        collisions[this.laser.collisionFunction],
        {
          power: this.laser.currentPower,
          efficiency: this.laser.efficiency,
        },
        this.laser.id,
      );
    }
    this.laser.currentPower -= this.laser.maxPower * (1 - this.laser.coherence) * dt * 1000;
    if (this.laser.currentPower < 0) {
      this.laser.currentPower = 0;
    }
  },

  updateCannonComponent() {
    const forwardVector = utilities.getForwardVector.call(this);
    // create projectiles
    if (this.cannon.firing) {
      const prjVelocity = [
        forwardVector[0] * this.cannon.power,
        forwardVector[1] * this.cannon.power,
      ];
      const ammo = this.cannon.ammo;
      constructors.createProjectile(
        this.game,
        this.x + (forwardVector[0] * 30),
        this.y + (forwardVector[1] * 30),
        prjVelocity[0] + this.velocityX,
        prjVelocity[1] + this.velocityY,
        constructors.createComponentDestructible(ammo.destructible),
        ammo.color,
        this,
        ammo.tracerSeed % ammo.tracerInterval === 0,
        collisions[ammo.collisionFunction],
      );
      this.cannon.firing = false;
      ammo.tracerSeed++;
    }
  },

  updateLauncherComponent() {
    if (this.launcher.firing) {
      const launchee = utilities.deepObjectMerge.call({}, this.launcher.tubes[0].ammo);
      launchee.x = this.x;
      launchee.y = this.y;
      launchee.velocityX = this.velocityX;
      launchee.velocityY = this.velocityY;
      launchee.rotation = this.rotation;
      launchee.color = this.color;
      launchee.specialProperties = { owner: this };
      if (this.targetingSystem && this.targetingSystem.lockedTargets.length > 0 && launchee.ai) {
        launchee.ai.specialProperties = {
          target: this.targetingSystem.lockedTargets[0],
        };
      }
      this.game.otherShips.push(constructors.createShip(launchee, this.game));
      this.launcher.firing = false;
    }
  },

  updateTargetingSystemComponent() {
    const forwardVector = utilities.getForwardVector.call(this);
    const rightVector = utilities.getRightVector.call(this);
    const ts = this.targetingSystem;
    // drop oldest targets if we have too many
    while (ts.targets.length > ts.maxTargets) {
      ts.targets.shift();
    }
    // if the angle to any of the targets is greater than the cone width 
    // or they are out of range, drop them
    for (let c = 0; c < ts.targets.length; c++) {
      const targetInfo = ts.targets[c];
      const target = targetInfo.this;
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
        [this.x, this.y],
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
      constructors.createHitscan(
        this.game,
        this.x + (forwardVector[0] * 30),
        this.y + (forwardVector[1] * 30),
        this.x + rangeVector[0],
        this.y + rangeVector[1],
        'rgb(255,0,0)',
        this,
        collisions.targetingLaserCollision, this.targetingSystem.id,
      );
      ts.firing = false;
    }
  },

  updateDestructibleComponent(dt) {
    // refresh shields
    if (this.destructible.shield.current < this.destructible.shield.max
      && this.destructible.shield.recharge > 0) {
      this.destructible.shield.current += this.destructible.shield.recharge * dt;

      if (this.destructible.shield.current > this.destructible.shield.max) {
        this.destructible.shield.current = this.destructible.shield.max;
      }
    }
  },

  updatePowerSystemComponent(dt) {
    // Scales target values of the given power system such that they sum to 1
    // Expects to be bound to the power system object
    function scalePowerTarget() {
      let sum = 0;
      for (let c = 0; c < this.target.length; c++) {
        sum += this.target[c];
      }
      if (sum === 0) {
        this.target = [0, 0, 0];
        return;
      }
      for (let c = 0; c < this.target.length; c++) { this.target[c] = this.target[c] / sum; }
    }

    // returns the current value of the given component ID (from component enum)
    // in the given power system after applying a transformation function
    const getPowerForComponent = (ps, component) => {
      if (component >= ps.current.length || component < 0) { return 0; }
      const components = ps.current.length;
      // this is the transformation function
      return utilities.clamp(
        0,
        (ps.current[component] - (1 / components)) / (2 * (1 / components)),
        1,
      );
    };

    // update power system
    // scale all relevant values down from the augmented 
    // to their normal using the old power values
    let thrusterPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.THRUSTERS);
    let laserPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.LASERS);
    let shieldPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.SHIELDS);
    // thrusters
    this.thrusterSystem.medial.maxStrength /= (1 + thrusterPower);
    this.thrusterSystem.lateral.maxStrength /= (1 + thrusterPower);
    this.thrusterSystem.rotational.maxStrength /= (1 + thrusterPower);
    this.stabilizer.clamps.medial /= (1 + thrusterPower);
    this.stabilizer.clamps.lateral /= (1 + thrusterPower);
    this.stabilizer.clamps.rotational /= (1 + thrusterPower);
    // lasers
    if (has.call(this, 'laser')) { this.laser.maxPower /= (1 + laserPower); }
    // shields
    this.destructible.shield.current /= (1 + shieldPower);
    this.destructible.shield.max /= (1 + shieldPower);
    this.destructible.shield.recharge /= (1 + shieldPower);

    // update the power values
    scalePowerTarget.call(this.powerSystem);
    this.powerSystem.current = utilities.lerpNd(
      this.powerSystem.current,
      this.powerSystem.target,
      this.powerSystem.transferRate * dt,
    );

    // clear power target
    for (let c = 0; c < this.powerSystem.target.length; c++) {
      this.powerSystem.target[c] = 0;
    }

    // scale back up to augmented with the new power values
    thrusterPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.THRUSTERS);
    laserPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.LASERS);
    shieldPower = getPowerForComponent(this.powerSystem, enums.SHIP_COMPONENTS.SHIELDS);
    // thrusters
    this.thrusterSystem.medial.maxStrength *= (1 + thrusterPower);
    this.thrusterSystem.lateral.maxStrength *= (1 + thrusterPower);
    this.thrusterSystem.rotational.maxStrength *= (1 + thrusterPower);
    this.stabilizer.clamps.medial *= (1 + thrusterPower);
    this.stabilizer.clamps.lateral *= (1 + thrusterPower);
    this.stabilizer.clamps.rotational *= (1 + thrusterPower);
    // lasers
    if (has.call(this, 'laser')) { this.laser.maxPower *= (1 + laserPower); }
    // shields
    this.destructible.shield.current *= (1 + shieldPower);
    this.destructible.shield.max *= (1 + shieldPower);
    this.destructible.shield.recharge *= (1 + shieldPower);
  },

  updateAiComponent(dt) {
    const aiF = aiFunctions[this.ai.aiFunction];
    aiF.call(this, dt);
  },

  updateRemoteInputComponent(dt) {
    const stab = this.stabilizer;
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_TAB]
      && !this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      stab.enabled = !stab.enabled;
      this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_TAB] = false;
    }

    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_C]) {
      stab.clamps.enabled = !stab.clamps.enabled;
      this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_C] = false;
    }

    // set this thruster values
    const ts = this.thrusterSystem;
    // medial motion
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_W]) {
      objControls.objMedialThrusters.call(this, ts.medial.maxStrength / stab.thrustRatio);
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_S]) {
      objControls.objMedialThrusters.call(this, -ts.medial.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { objControls.objMedialStabilizers.call(this, dt); }

    // lateral motion
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_A]) {
      objControls.objLateralThrusters.call(this, ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_D]) {
      objControls.objLateralThrusters.call(this, -ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { objControls.objLateralStabilizers.call(this, dt); }

    // rotational motion - mouse    
    // console.log(-this.remoteInput.mouseDirection); 
    const mouseDirection = this.remoteInput.mouseDirection;
    const coeff = (15 / this.remoteInput.sendInterval) * dt * ts.rotational.maxStrength;
    objControls.objRotationalThrusters.call(this,
      (-mouseDirection * coeff) / stab.thrustRatio,
    );
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_LEFT]) {
      objControls.objRotationalThrusters.call(this, ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_RIGHT]) {
      objControls.objRotationalThrusters.call(this, -ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { objControls.objRotationalStabilizers.call(this, dt); }

    // weapons
    if (this.remoteInput.mouse[myMouse.BUTTONS.LEFT]
      || this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_SPACE]) {
      if (has.call(this, 'laser')) {
        objControls.objFireLaser.call(this);
      } else if (has.call(this, 'cannon')) {
        objControls.objFireCannon.call(this);
      }
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_Q]) {
      objControls.objFireLauncher.call(this);
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_E]) {
      objControls.objFireTargetingSystem.call(this);
    }

    // power system
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_SHIFT]) {
      this.powerSystem.target[enums.SHIP_COMPONENTS.THRUSTERS] = 1;
    }
    if (this.remoteInput.mouse[myMouse.BUTTONS.RIGHT]) {
      this.powerSystem.target[enums.SHIP_COMPONENTS.LASERS] = 1;
    }
    if (this.remoteInput.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      this.powerSystem.target[enums.SHIP_COMPONENTS.SHIELDS] = 1;
    }

    const sinceLastSend = this.game.elapsedGameTime - this.remoteInput.lastSend;
    if (this.remoteInput.remoteSend && sinceLastSend >= this.remoteInput.sendInterval) {
      this.remoteInput.lastSend = this.game.elapsedGameTime;
      gameFunctions.queueFunction(this.game, () => {
        const d = {};
        // if (!this.remoteInput.sentInterval) {
        //   d.interval = this.remoteInput.sendInterval;
        //   this.remoteInput.sentInterval = true;
        // }
        d.interval = sinceLastSend;
        d.x = this.x;
        d.y = this.y;
        d.rotation = this.rotation;
        d.velX = this.velocityX;
        d.velY = this.velocityY;
        d.rotationalVelocity = this.rotationalVelocity;
        d.velocityClamps = stab.clamps;
        d.stabilized = stab.enabled;
        const fetchInfo = gameFunctions.fetchFromTileArray(this.game, [this.x, this.y], 15000);
        const worldInfo = {
          objs: [],
          asteroids: {
            objs: [],
            colors: [],
          },
          radials: [],
          prjs: [],
          hitscans: [],
        };
        for (let c = 0; c < fetchInfo.obj.length; c++) {
          const o = fetchInfo.obj[c];
          const dest = o.destructible;
          const ots = o.thrusterSystem;
          const wi = {
            id: o.id,
            x: o.x,
            y: o.y,
            rotation: o.rotation,
            radius: dest.radius,
            shp: (dest.shield.max > 0) ? dest.shield.current / dest.shield.max : 0,
            shc: dest.shield.max / dest.shield.efficiency,
            hp: dest.hp / dest.maxHp,
            color: o.color,
            // model: utilities.deepObjectMerge.call({}, o.model),
            medial: ots.medial.currentStrength / ots.medial.efficiency,
            lateral: ots.lateral.currentStrength / ots.lateral.efficiency,
            rotational: ots.rotational.currentStrength / ots.rotational.efficiency,
            thrusterColor: ots.color,
          };
          worldInfo.objs.push(wi);
        }
        for (let c = 0; c < this.game.asteroids.colors.length; c++) {
          worldInfo.asteroids.colors.push(this.game.asteroids.colors[c]);
        }
        for (let c = 0; c < fetchInfo.asteroid.length; c++) {
          const a = fetchInfo.asteroid[c];
          worldInfo.asteroids.objs.push({
            x: a.x,
            y: a.y,
            colorIndex: a.colorIndex,
            radius: a.destructible.radius,
          });
        }
        for (let c = 0; c < fetchInfo.prj.length; c++) {
          const p = fetchInfo.prj[c];
          if (p.visible) {
            worldInfo.prjs.push({
              id: p.id,
              x: p.x,
              y: p.y,
              velocityX: p.velocityX,
              velocityY: p.velocityY,
              color: p.color,
              radius: p.destructible.radius,
            });
          }
        }
        for (let c = 0; c < fetchInfo.hitscan.length; c++) {
          const h = fetchInfo.hitscan[c];
          worldInfo.hitscans.push({
            id: h.id,
            startX: h.startX,
            startY: h.startY,
            endX: h.endX,
            endY: h.endY,
            color: h.color,
            power: h.power,
            efficiency: h.efficiency,
          });
        }
        for (let c = 0; c < fetchInfo.radial.length; c++) {
          const r = fetchInfo.radial[c];
          worldInfo.radials.push({
            id: r.id,
            x: r.x,
            y: r.y,
            velocity: r.velocity,
            radius: r.radius,
            color: r.color,
          });
        }
        d.worldInfo = worldInfo;
        // d.powerDistribution = 
        // console.log('remote send');
        this.remoteInput.remoteSend(d);
      });
    }
  },

  updatePrj(dt) {
    this.destructible.hp -= this.destructible.maxHp * 2.5 * dt;
  },

  queueReport() {
    const game = (this.game) ? this.game : this.owner.game;
    if (this.x < game.tileArray.min[0]) { game.tileArray.min[0] = this.x; }
    if (this.y < game.tileArray.min[1]) { game.tileArray.min[1] = this.y; }
    if (this.x > game.tileArray.max[0]) { game.tileArray.max[0] = this.x; }
    if (this.y > game.tileArray.max[1]) { game.tileArray.max[1] = this.y; }
    game.reportQueue.push(this);
  },

  updateUpdatable(dt) {
    for (let c = 0; c < this.updaters.length; c++) {
      // this.updaters[c].bind(updaters)(this,dt);
      this.updaters[c].call(this, dt);
    }
  },

  populateUpdaters() {
    const updateFunctions = [];

    if (has.call(this, 'velocityX') && has.call(this, 'velocityY')) {
      updateFunctions.push(updaters.updateMobile);
    }
    if (this.ai) { updateFunctions.push(updaters.updateAiComponent); }
    if (this.thrusterSystem) { updateFunctions.push(updaters.updateThrusterSystem); }
    if (this.laser) { updateFunctions.push(updaters.updateLaserComponent); }
    if (this.cannon) { updateFunctions.push(updaters.updateCannonComponent); }
    if (this.destructible && this.destructible.shield.recharge > 0) {
      updateFunctions.push(updaters.updateShieldComponent);
    }
    if (this.powerSystem) { updateFunctions.push(updaters.updatePowerSystem); }
    if (this.launcher) { updateFunctions.push(updaters.updateLauncherComponent); }
    if (this.targetingSystem) { updateFunctions.push(updaters.updateTargetingSystemComponent); }

    this.updaters = updateFunctions;
  },

  populateOnDestroy() {
    const onDestroyFunctions = [];
    if (this.warhead) { onDestroyFunctions.push(destructors.destroyWarhead); }
    if (this.respawnTime) { onDestroyFunctions.push(destructors.queueRespawn); }
    if (this.remoteInput) { onDestroyFunctions.push(destructors.destroyRemoteInput); }
    onDestroyFunctions.push(destructors.returnIdTag);
    this.onDestroy = onDestroyFunctions;
  },
};
module.exports.content = updaters;
