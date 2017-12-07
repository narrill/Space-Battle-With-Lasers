const utilities = require('../utilities.js');
const id = require('../id.js');
const keys = require('../keys.js');
const enums = require('../enums.js');

const myKeys = keys.myKeys;
const myMouse = keys.myMouse;

const has = Object.prototype.hasOwnProperty;

class RemoteInput {
  constructor(objectParams = {}, owner) {
    this.owner = owner;
    this.id = id.takeIdTag();
    this.keyboard = [];
    this.mouse = [];
    this.mouseDirection = 0;
    this.lastSend = 0;
    this.sendInterval = 66.6666;
    this.nonInterp = {};

    utilities.veryShallowObjectMerge.call(this, objectParams);
  }

  update() {
    const owner = this.owner;
    const stab = owner.stabilizer;
    if (this.keyboard[myKeys.KEYBOARD.KEY_TAB]
      && !this.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      stab.enabled = !stab.enabled;
      this.keyboard[myKeys.KEYBOARD.KEY_TAB] = false;
    }

    if (this.keyboard[myKeys.KEYBOARD.KEY_C]) {
      stab.clamps.enabled = !stab.clamps.enabled;
      this.keyboard[myKeys.KEYBOARD.KEY_C] = false;
    }

    // set this thruster values
    const ts = owner.thrusterSystem;
    // medial motion
    if (this.keyboard[myKeys.KEYBOARD.KEY_W]) {
      owner.objMedialThrusters(ts.medial.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_S]) {
      owner.objMedialThrusters(-ts.medial.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objMedialStabilizers(); }

    // lateral motion
    if (this.keyboard[myKeys.KEYBOARD.KEY_A]) {
      owner.objLateralThrusters(ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_D]) {
      owner.objLateralThrusters(-ts.lateral.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objLateralStabilizers(); }

    // rotational motion - mouse    
    // console.log(-this.remoteInput.mouseDirection); 
    const mouseDirection = this.mouseDirection;
    const mouseSensitivity = 150;
    owner.objRotationalThrusters(
      (((-mouseDirection) / mouseSensitivity) * ts.rotational.maxStrength) / stab.thrustRatio,
    );
    if (this.keyboard[myKeys.KEYBOARD.KEY_LEFT]) {
      owner.objRotationalThrusters(ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_RIGHT]) {
      owner.objRotationalThrusters(-ts.rotational.maxStrength / stab.thrustRatio);
    }
    if (stab.enabled) { owner.objRotationalStabilizers(); }

    // weapons
    if (this.mouse[myMouse.BUTTONS.LEFT]
      || this.keyboard[myKeys.KEYBOARD.KEY_SPACE]) {
      if (has.call(owner, 'laser')) {
        owner.objFireLaser();
      } else if (has.call(owner, 'cannon')) {
        owner.objFireCannon();
      }
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_Q]) {
      owner.objFireLauncher();
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_E]) {
      owner.objFireTargetingSystem();
    }

    // power system
    if (this.keyboard[myKeys.KEYBOARD.KEY_SHIFT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.THRUSTERS] = 1;
    }
    if (this.mouse[myMouse.BUTTONS.RIGHT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.LASERS] = 1;
    }
    if (this.keyboard[myKeys.KEYBOARD.KEY_ALT]) {
      owner.powerSystem.target[enums.SHIP_COMPONENTS.SHIELDS] = 1;
    }

    const sinceLastSend = owner.game.elapsedGameTime - this.lastSend;
    if (this.remoteSend && sinceLastSend >= this.sendInterval) {
      this.lastSend += this.sendInterval;
      owner.game.queueFunction(() => {
        const d = {};
        if (!this.sentInterval) {
          d.interval = this.sendInterval;
          this.sentInterval = true;
        }
        if (!this.sentId) {
          d.id = owner.id;
          this.sentId = true;
        }

        const fetchInfo = owner.game.spatialHash.fetch([owner.x, owner.y], 15000);
        const worldInfo = {
          objs: [],
          asteroids: {},
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
            medial: ots.medial.currentStrength / ots.medial.efficiency,
            lateral: ots.lateral.currentStrength / ots.lateral.efficiency,
            rotational: ots.rotational.currentStrength / ots.rotational.efficiency,
            thrusterColor: ots.color,
          };

          if (o.id === owner.id) {
            wi.velX = owner.velocityX;
            wi.velY = owner.velocityY;
            wi.rotationalVelocity = owner.rotationalVelocity;
            wi.clampMedial = stab.clamps.medial;
            wi.clampLateral = stab.clamps.lateral;
            wi.clampRotational = stab.clamps.rotational;
            wi.clampsEnabled = stab.clamps.enabled;
            wi.stabilized = stab.enabled;
            wi.thrusterPower = owner.powerSystem.getPowerForComponent(
              enums.SHIP_COMPONENTS.THRUSTERS,
            );
            wi.weaponPower = owner.powerSystem.getPowerForComponent(
              enums.SHIP_COMPONENTS.LASERS,
            );
            wi.shieldPower = owner.powerSystem.getPowerForComponent(
              enums.SHIP_COMPONENTS.SHIELDS,
            );
          }
          worldInfo.objs.push(wi);
        }

        if (!this.sentAsteroidColors) {
          worldInfo.asteroids.colors = [];
          for (let c = 0; c < owner.game.asteroids.colors.length; c++) {
            worldInfo.asteroids.colors.push(owner.game.asteroids.colors[c]);
          }
          this.sentAsteroidColors = true;
        }

        const newAsteroidsById = {};
        for (let c = 0; c < fetchInfo.asteroid.length; c++) {
          const a = fetchInfo.asteroid[c];
          newAsteroidsById[a.id] = a;
        }
        const previousAsteroidsById = this.nonInterp.asteroids || {};
        const newKeys = Object.keys(newAsteroidsById);
        for (let c = 0; c < newKeys.length; c++) {
          const aid = newKeys[c];
          if (!previousAsteroidsById[aid]) {
            if (!worldInfo.asteroids.objs) { worldInfo.asteroids.objs = []; }
            const a = newAsteroidsById[aid];
            worldInfo.asteroids.objs.push({
              id: a.id,
              x: a.x,
              y: a.y,
              colorIndex: a.colorIndex,
              radius: a.destructible.radius,
            });
          }
        }
        const prevKeys = Object.keys(previousAsteroidsById);
        for (let c = 0; c < prevKeys.length; c++) {
          const aid = prevKeys[c];
          if (!newAsteroidsById[aid]) {
            if (!worldInfo.asteroids.objs) { worldInfo.asteroids.objs = []; }
            worldInfo.asteroids.objs.push({
              destroyed: aid,
            });
          }
        }
        this.nonInterp.asteroids = newAsteroidsById;

        if (fetchInfo.prj.length) { worldInfo.prjs = []; }
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

        if (fetchInfo.hitscan.length) { worldInfo.hitscans = []; }
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

        if (fetchInfo.radial.length) { worldInfo.radials = []; }
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
        this.remoteSend(d);
      });
    }
  }

  messageHandler(data) {
    if (data.disconnect && this.remoteSend) { delete this.remoteSend; }
    if (data.keyCode) { this.keyboard[data.keyCode] = data.pos; }
    if (data.mb || data.mb === 0) { this.mouse[data.mb] = data.pos; }
    if (data.md || data.md === 0) {
      this.mouseDirection = data.md;
    }
  }

  destroy() {
    this.remoteSend(null, 'destroyed');
  }
}

module.exports = RemoteInput;
