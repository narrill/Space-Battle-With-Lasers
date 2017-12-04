const dependencyCatch = require('./dependencyCatch.js');
const utilities = require('./utilities.js');
const id = require('./id.js');
const gridFunctions = require('./gridFunctions.js');
const has = Object.prototype.hasOwnProperty;
const constructors = dependencyCatch(require('./constructors.js'));
const COMPONENT_TYPES = require('./ComponentTypes.js').TYPES;
const componentClasses = require('./ComponentTypes.js').classes;
const updaters = dependencyCatch(require('./updaters.js'));

class Obj {
  constructor(objectParams = {}, game, ownerId) {
    const gridPosition = gridFunctions.randomGridPosition(game.grid);
    this.id = id.takeIdTag();
    this.game = game;
    this.faction = -1;
    // position/rotation
    this.x = gridPosition.x;
    this.y = gridPosition.y;
    this.rotation = 0;
    this.prevX = (has.call(objectParams, 'x')) ? objectParams.x : gridPosition.x;
    this.prevY = (has.call(objectParams, 'y')) ? objectParams.y : gridPosition.y;
    // velocities
    this.velocityX = 0; // in absolute form, used for movement
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.rotationalVelocity = 0;
    this.rotationalAcceleration = 0;
    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
    this.medialVelocity = undefined; // component form, used by stabilizers
    this.lateralVelocity = undefined;
    this.destructible = new componentClasses.Destructible(utilities.deepObjectMerge.call({
      hp: 100,
      radius: 25,
      shield: {
      max: 100,
      recharge: 3,
      efficiency: 8,
      },
    }, objectParams.destructible));
    this.thrusterSystem = new componentClasses.ThrusterSystem(
      this, utilities.deepObjectMerge.call({}, objectParams.thrusters),
    ),
    // colors
    this.color = utilities.getRandomBrightColor();
    // model
    this.model = (has.call(objectParams, 'model')) ? objectParams.model : ships.cheetah.model;
    this.constructionObject = utilities.deepObjectMerge.call({}, objectParams);
    this.type = 'obj';

    // this is for adding additional components. also it's super janky
    // iterate through params
    Object.keys(objectParams).forEach((key) => {
      // if params contains something ship doesn't
      if (!has.call(this, key)) {
        // capitalize the first letter and try to find a constructor for it
        const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
        const constructor = constructors[`createComponent${capitalized}`];
        // if a constructor was found, call it
        if (constructor) {
          const newParams = objectParams[key];
          this[key] = constructor(utilities.deepObjectMerge.call({}, newParams));
        }
      }
    });

    utilities.veryShallowObjectMerge.call(this, objectParams);

    if (this.faction !== -1) { this.color = game.factionColors[this.faction]; }

    this.updaters = [];
    this.updaters.push(updaters.updateMobile);
    this.updaters.push(function() { this.game.reportQueue.push(this); });
    Object.keys(this).forEach((key) => {
      const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
      const updater = updaters[`update${capitalized}Component`];
      if (updater) { this.updaters.push(updater); }
    });

    updaters.populateOnDestroy.call(this);

    Object.values(game.socketSubscriptions).forEach((socket) => {
      if (ownerId && socket.id === ownerId && this.model.overlay.ranges) {
        const modelCopy = utilities.deepObjectMerge.call({}, this.model);
        const key2s = Object.keys(modelCopy.overlay.ranges);
        for (let n = 0; n < key2s.length; n++) {
          const key2 = key2s[n];
          let r = this[key2];
          if (r) r = r.range;
          if (r) modelCopy.overlay.ranges[key2] = r;
        }
        socket.emit('ship', { id: this.id, model: modelCopy });
      } else { socket.emit('ship', { id: this.id, model: this.model }); }
    });
  }

  // add given strength to main thruster
  objMedialThrusters(strength) {
    this.thrusterSystem.medial.targetStrength += strength;
  }

  // add strength to side thruster
  objRotationalThrusters(strength) {
    this.thrusterSystem.rotational.targetStrength += strength;
  }

  // add strength to lateral thruster
  objLateralThrusters(strength) {
    this.thrusterSystem.lateral.targetStrength += strength;
  }

  // rotational stabilizer
  objRotationalStabilizers() {
    if (!this.stabilizer) { return; }

    if (this.thrusterSystem.rotational.targetStrength * this.rotationalVelocity >= -10
      && Math.abs(this.rotationalVelocity) > this.stabilizer.precision / 6) {
      this.objRotationalThrusters(
        this.rotationalVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(this.rotationalVelocity) >= this.stabilizer.clamps.rotational
      && this.thrusterSystem.rotational.targetStrength * this.rotationalVelocity < 0) {
      this.thrusterSystem.rotational.targetStrength = 0;
    }
  }

  // medial stabilizer
  objMedialStabilizers() {
    if (!this.stabilizer) { return; }

    const medialVelocity = utilities.getMedialVelocity.call(this);

    if (this.thrusterSystem.medial.targetStrength * medialVelocity >= 0
      && Math.abs(medialVelocity) > this.stabilizer.precision) {
      this.objMedialThrusters(
        medialVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(medialVelocity) >= this.stabilizer.clamps.medial
      && this.thrusterSystem.medial.targetStrength * medialVelocity < 0) {
      this.thrusterSystem.medial.targetStrength = 0;
    }
  }

  // lateral stabilizer
  objLateralStabilizers() {
    if (!this.stabilizer) { return; }
    // see above
    const lateralVelocity = utilities.getLateralVelocity.call(this);
    if (this.thrusterSystem.lateral.targetStrength * lateralVelocity >= 0
      && Math.abs(lateralVelocity) > this.stabilizer.precision) {
      this.objLateralThrusters(
        lateralVelocity * this.stabilizer.strength,
      );
    } else if (this.stabilizer.clamps.enabled
      && Math.abs(lateralVelocity) >= this.stabilizer.clamps.lateral
      && this.thrusterSystem.lateral.targetStrength * lateralVelocity < 0) {
      this.thrusterSystem.lateral.targetStrength = 0;
    }
  }

  objFireLaser() {
    if (!this.laser) { return; }
    const now = this.game.elapsedGameTime;
    // if the cool down is up
    if (now > this.laser.lastFireTime + (this.laser.cd * 1000)) {
      this.laser.lastFireTime = now;
      this.laser.currentPower = this.laser.maxPower;
    }
  }

  objFireCannon() {
    if (!this.cannon) { return; }
    const now = this.game.elapsedGameTime;
    if (now > this.cannon.lastFireTime + (this.cannon.cd * 1000)) {
      this.cannon.lastFireTime = now;
      this.cannon.firing = true;
    }
  }

  objFireLauncher() {
    if (!this.launcher) { return; }
    const now = this.game.elapsedGameTime;
    if (now > this.launcher.lastFireTime + (this.launcher.cd * 1000)) {
      this.launcher.lastFireTime = now;
      this.launcher.firing = true;
    }
  }

  objFireTargetingSystem() {
    if (!this.targetingSystem) { return; }
    this.targetingSystem.firing = true;
  }
}

module.exports = Obj;