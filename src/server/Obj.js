const utilities = require('./utilities.js');
const id = require('./id.js');
const gridFunctions = require('./gridFunctions.js');
const enums = require('./enums.js');

const has = Object.prototype.hasOwnProperty;
const componentClasses = require('./ComponentTypes.js').classes;
const Mobile = require('./Mobile.js');

class Obj extends Mobile {
  constructor(objectParams = {}, game, ownerId) {
    super();
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
    this.forceX = 0;
    this.forceY = 0;
    this.rotationalVelocity = 0;
    this.rotationalForce = 0;
    this.forwardVectorX = undefined;
    this.forwardVectorY = undefined;
    this.rightVectorX = undefined;
    this.rightVectorY = undefined;
    this.medialVelocity = undefined; // component form, used by stabilizers
    this.lateralVelocity = undefined;
    this.mass = objectParams.physicalProperties.mass;
    // colors
    this.color = utilities.getRandomBrightColor();
    // model
    this.model = objectParams.model;
    this.constructionObject = utilities.deepObjectMerge.call({}, objectParams);
    this.type = 'obj';

    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
    const physProp = objectParams.physicalProperties;

    // Set defaults
    const defaults = {
      destructible: {
        hp: physProp.mass * physProp.mass,
        radius: Math.sqrt(physProp.area / Math.PI),
        shield: {
          max: 100,
          recharge: 3,
          efficiency: 8,
        },
      },
    };

    // Populate components
    this.updatableComponents = [];
    this.destructibleComponents = [];
    Object.keys(objectParams).forEach((key) => {
      if (!has.call(this, key)) {
        const Component = componentClasses[capitalize(key)];
        if (Component) {
          const newParams = objectParams[key];
          const defaultParams = defaults[key] || {};
          const params = utilities.deepObjectMerge.call(defaultParams, newParams);
          const component = new Component(params, this);
          if (component.update) { this.updatableComponents.push(component); }
          if (component.destroy) {
            this.destructibleComponents.push(component);
          }
          this[key] = component;
        }
      }
    });

    // Copy any top-level literal overrides
    utilities.veryShallowObjectMerge.call(this, objectParams);

    // Faction coloring (though factions don't do anything right now)
    if (this.faction !== -1) { this.color = game.factionColors[this.faction]; }

    // Pass model data to clients - this is a bit of a hack
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

  update(dt) {
    super.update(dt);
    this.game.reportQueue.push(this);
    for (let c = 0; c < this.updatableComponents.length; c++) {
      this.updatableComponents[c].update(dt);
    }
  }

  get shouldDestroy() {
    // Check culling
    let shouldCull = false;
    if (has.call(this, 'cullTolerance')) {
      const grid = this.game.grid;
      const gridDimensions = grid.gridLines * grid.gridSpacing;
      const tolerancePercent = this.cullTolerance;
      const tolerances = [gridDimensions * tolerancePercent, gridDimensions * tolerancePercent];
      const position = [this.x, this.y];
      shouldCull = !gridFunctions.isPositionInGrid(position, grid, tolerances);
    }

    return shouldCull || (this.destructible && this.destructible.isDead);
  }

  destroy() {
    const returnIdTag = (src) => {
      if (!src) { return; }
      Object.keys(src).forEach((key) => {
        const shouldRecurse =
          key !== 'game'
          && key !== 'owner'
          && src[key] instanceof Object
          && !(src[key] instanceof Array);
        if (shouldRecurse) {
          returnIdTag(src[key]);
        } else if (key === 'id') {
          id.returnIdTag(src[key]);
        }
      });
    };

    for (let c = 0; c < this.destructibleComponents.length; c++) {
      this.destructibleComponents[c].destroy();
    }
    if (this.respawnTime) {
      this.game.respawnQueue.push({
        time: this.game.elapsedGameTime + (this.respawnTime * 1000),
        params: this.constructionObject,
      });
    }
    returnIdTag(this);
  }

  get networkRepresentation() {
    const dest = this.destructible;
    const ts = this.thrusterSystem;
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      radius: dest.radius,
      shp: (dest.shield.max > 0) ? dest.shield.current / dest.shield.max : 0,
      shc: dest.shield.max / dest.shield.efficiency,
      hp: dest.hp / dest.maxHp,
      color: this.color,
      medial: ts.medial.currentStrength / ts.medial.efficiency,
      lateral: ts.lateral.currentStrength / ts.lateral.efficiency,
      rotational: ts.rotational.currentStrength / ts.rotational.efficiency,
      thrusterColor: ts.color,
    };
  }

  get networkPlayerRepresentation() {
    const stab = this.stabilizer;
    const ps = this.powerSystem;
    return {
      x: this.x,
      y: this.y,
      velX: this.velocityX,
      velY: this.velocityY,
      rotation: this.rotation,
      rotationalVelocity: this.rotationalVelocity,
      clampMedial: stab.clamps.medial,
      clampLateral: stab.clamps.lateral,
      clampRotational: stab.clamps.rotational,
      clampsEnabled: stab.clamps.enabled,
      stabilized: stab.enabled,
      thrusterPower: ps.getPowerForComponent(
        enums.SHIP_COMPONENTS.THRUSTERS,
      ),
      weaponPower: ps.getPowerForComponent(
        enums.SHIP_COMPONENTS.LASERS,
      ),
      shieldPower: ps.getPowerForComponent(
        enums.SHIP_COMPONENTS.SHIELDS,
      )
    }
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
