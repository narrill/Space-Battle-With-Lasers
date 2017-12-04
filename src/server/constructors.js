// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/constructors.js

const dependencyCatch = require('./dependencyCatch.js');
const id = require('./id.js');
const utilities = require('./utilities.js');
const gridFunctions = require('./gridFunctions.js');
const ships = require('./ships.js');
const updaters = dependencyCatch(require('./updaters.js'));
const missiles = require('./missiles.js');
const componentClasses = require('./ComponentTypes.js').classes;

const has = Object.prototype.hasOwnProperty;

const constructors = {
  createPlayer(objectParams = {}, game) {
    const pl = {
      game,
      socket: objectParams.socket,
      lastSpawn: 0,
      currentShip: undefined,
    };
    utilities.veryShallowObjectMerge.call(pl, objectParams);
    return pl;
  },

  // constructor for ship objects
  // createShip(objectParams = {}, game, ownerId) {
  //   const gridPosition = gridFunctions.randomGridPosition(game.grid);
  //   const ship = {
  //     id: id.takeIdTag(),
  //     game,
  //     faction: -1,
  //     // position/rotation
  //     x: gridPosition.x,
  //     y: gridPosition.y,
  //     rotation: 0,
  //     prevX: (has.call(objectParams, 'x')) ? objectParams.x : gridPosition.x,
  //     prevY: (has.call(objectParams, 'y')) ? objectParams.y : gridPosition.y,
  //     // velocities
  //     velocityX: 0, // in absolute form, used for movement
  //     velocityY: 0,
  //     accelerationX: 0,
  //     accelerationY: 0,
  //     rotationalVelocity: 0,
  //     rotationalAcceleration: 0,
  //     forwardVectorX: undefined,
  //     forwardVectorY: undefined,
  //     rightVectorX: undefined,
  //     rightVectorY: undefined,
  //     medialVelocity: undefined, // component form, used by stabilizers
  //     lateralVelocity: undefined,
  //     destructible: constructors.createComponentDestructible(utilities.deepObjectMerge.call({
  //       hp: 100,
  //       radius: 25,
  //       shield: {
  //         max: 100,
  //         recharge: 3,
  //         efficiency: 8,
  //       },
  //     }, objectParams.destructible)),
  //     thrusterSystem: constructors.createComponentThrusterSystem(
  //       utilities.deepObjectMerge.call({}, objectParams.thrusters),
  //     ),
  //     // colors
  //     color: utilities.getRandomBrightColor(),
  //     // model
  //     model: (has.call(objectParams, 'model')) ? objectParams.model : ships.cheetah.model,
  //     weaponToggle: true,
  //     constructionObject: utilities.deepObjectMerge.call({}, objectParams),
  //     type: 'obj',
  //   };

  //   // this is for adding additional components. also it's super janky
  //   // iterate through params
  //   Object.keys(objectParams).forEach((key) => {
  //     // if params contains something ship doesn't
  //     if (!has.call(ship, key)) {
  //       // capitalize the first letter and try to find a constructor for it
  //       const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
  //       const constructor = constructors[`createComponent${capitalized}`];
  //       // if a constructor was found, call it
  //       if (constructor) {
  //         const newParams = objectParams[key];
  //         ship[key] = constructor(utilities.deepObjectMerge.call({}, newParams));
  //       }
  //     }
  //   });

  //   // utilities.deepObjectMerge(ship, defaults);
  //   utilities.veryShallowObjectMerge.call(ship, objectParams);

  //   if (ship.faction !== -1) { ship.color = game.factionColors[ship.faction]; }

  //   // updaters.populateUpdaters(ship);
  //   ship.updaters = [];
  //   ship.updaters.push(updaters.updateMobile);
  //   ship.updaters.push(function() { this.game.reportQueue.push(this); });
  //   Object.keys(ship).forEach((key) => {
  //     const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
  //     const updater = updaters[`update${capitalized}Component`];
  //     if (updater) { ship.updaters.push(updater); }
  //   });

  //   updaters.populateOnDestroy.call(ship);

  //   Object.values(game.socketSubscriptions).forEach((socket) => {
  //     if (ownerId && socket.id === ownerId && ship.model.overlay.ranges) {
  //       const modelCopy = utilities.deepObjectMerge.call({}, ship.model);
  //       const key2s = Object.keys(modelCopy.overlay.ranges);
  //       for (let n = 0; n < key2s.length; n++) {
  //         const key2 = key2s[n];
  //         let r = ship[key2];
  //         if (r) r = r.range;
  //         if (r) modelCopy.overlay.ranges[key2] = r;
  //       }
  //       socket.emit('ship', { id: ship.id, model: modelCopy });
  //     } else { socket.emit('ship', { id: ship.id, model: ship.model }); }
  //   });

  //   return ship;
  // },

  // constructor for the thruster system component
  // createComponentThrusterSystem(objectParams = {}) {
  //   const ts = {
  //     id: id.takeIdTag(),
  //     color: utilities.getRandomBrightColor(),
  //     noiseLevel: 0,
  //     medial: constructors.createComponentThruster(utilities.deepObjectMerge.call({
  //       maxStrength: 1000,
  //       efficiency: 300,
  //     }, objectParams.medial)),
  //     lateral: constructors.createComponentThruster(utilities.deepObjectMerge.call({
  //       maxStrength: 660,
  //       efficiency: 300,
  //     }, objectParams.lateral)),
  //     rotational: constructors.createComponentThruster(utilities.deepObjectMerge.call({
  //       maxStrength: 250,
  //       efficiency: 100,
  //     }, objectParams.rotational)),
  //   };

  //   utilities.veryShallowObjectMerge.call(ts, objectParams);

  //   return ts;
  // },

  // constructor for the thruster component
  // createComponentThruster(objectParams = {}) {
  //   const t = {
  //     id: id.takeIdTag(),
  //     currentStrength: 0,
  //     targetStrength: 0,
  //     maxStrength: 1000,
  //     efficiency: 1000,
  //     powerRampPercentage: 20,
  //     powerRampLimit: 6000,
  //   };

  //   utilities.veryShallowObjectMerge.call(t, objectParams);

  //   return t;
  // },

  // constructor for the power system component
  createComponentPowerSystem(objectParams = {}) {
    const ps = {
      id: id.takeIdTag(),
      current: [0, 0, 0],
      target: [0, 0, 0],
      transferRate: 6,
    };

    utilities.veryShallowObjectMerge.call(ps, objectParams);

    return ps;
  },

  // constructor for the stabilizer component
  createComponentStabilizer(objectParams = {}) {
    const stab = {
      id: id.takeIdTag(),
      enabled: true,
      strength: 6,
      thrustRatio: 1.5,
      precision: 10,
      clamps: constructors.createComponentStabilizerClamps(
        utilities.deepObjectMerge.call({}, objectParams.clamps),
      ),
    };

    utilities.veryShallowObjectMerge.call(stab, objectParams);

    return stab;
  },

  // constructor for the stabilizer clamps sub-component
  createComponentStabilizerClamps(objectParams = {}) {
    const clamps = {
      id: id.takeIdTag(),
      enabled: true,
      medial: 1000,
      lateral: 660,
      rotational: 90,
    };

    utilities.veryShallowObjectMerge.call(clamps, objectParams);
    return clamps;
  },

  // constructor for the laser component
  createComponentLaser(objectParams = {}) {
    const lsr = {
      id: id.takeIdTag(),
      lastFireTime: 0,
      cd: 0.3,
      range: 2000,
      color: utilities.getRandomBrightColor(),
      currentPower: 0,
      coherence: 0.995,
      maxPower: 1000,
      efficiency: 50,
      spread: 0,
      collisionFunction: 'basicLaserCollision',
    };

    utilities.veryShallowObjectMerge.call(lsr, objectParams);

    return lsr;
  },

  // constructor for cannon component
  createComponentCannon(objectParams) {
    const cn = {
      id: id.takeIdTag(),
      firing: false,
      lastFireTime: 0,
      cd: 0.12,
      power: 10000,
      ammo: constructors.createComponentAmmo(utilities.deepObjectMerge.call({}, objectParams.ammo)),
    };

    utilities.veryShallowObjectMerge.call(cn, objectParams);

    return cn;
  },

  createComponentAmmo(objectParams = {}) {
    const am = {
      id: id.takeIdTag(),
      destructible: new componentClasses.Destructible(utilities.deepObjectMerge.call({
        hp: 25,
        radius: 10,
      }, objectParams.destructible)),
      color: 'yellow',
      tracerInterval: 1,
      tracerSeed: 0,
      collisionFunction: 'basicKineticCollision',
    };

    utilities.veryShallowObjectMerge.call(am, objectParams);

    return am;
  },

  createComponentLauncher(objectParams = {}) {
    const ln = {
      id: id.takeIdTag(),
      tubes: [
        { ammo: missiles.tomcat, lastFireTime: 0 },
      ],
      firing: false,
      cd: 4,
      fireInterval: 0.1,
      lastFireTime: 0,
    };

    utilities.veryShallowObjectMerge.call(ln, objectParams);

    return ln;
  },

  createComponentTargetingSystem(objectParams = {}) {
    const ts = {
      id: id.takeIdTag(),
      targets: [],
      maxTargets: 1,
      range: 50000,
      lockConeWidth: 45,
      lockTime: 3,
      lockedTargets: [],
    };

    utilities.veryShallowObjectMerge.call(ts, objectParams);

    return ts;
  },

  createComponentWarhead(objectParams = {}) {
    const wh = {
      id: id.takeIdTag(),
      radial: utilities.deepObjectMerge.call({
        velocity: 6000,
        decay: 12,
        color: 'red',
        collisionProperties: {
          density: 8,
        },
        collisionFunction: 'basicBlastwaveCollision',
      }, objectParams.radial),
    };

    return wh;
  },

  // constructor for the destructible component - stores hp, shields, and collider radius
  // createComponentDestructible(objectParams = {}) {
  //   const ds = {
  //     id: id.takeIdTag(),
  //     hp: 500,
  //     maxHp: (objectParams.hp) ? objectParams.hp : 500,
  //     radius: 500,
  //     shield: constructors.createComponentDestructibleShield(
  //       utilities.deepObjectMerge.call({}, objectParams.shield),
  //     ),
  //   };

  //   utilities.veryShallowObjectMerge.call(ds, objectParams);

  //   return ds;
  // },

  // constructor for the shield sub-component
  // createComponentDestructibleShield(objectParams = {}) {
  //   const sh = {
  //     id: id.takeIdTag(),
  //     current: (objectParams.max) ? objectParams.max : 0,
  //     max: 0,
  //     efficiency: 0,
  //     recharge: 0,
  //   };

  //   utilities.veryShallowObjectMerge.call(sh, objectParams);

  //   return sh;
  // },

  // constructor for the AI component
  createComponentAi(objectParams = {}) {
    const ai = {
      id: id.takeIdTag(),
      aiFunction: undefined,
    };
    utilities.veryShallowObjectMerge.call(ai, objectParams);

    return ai;
  },

  createComponentRemoteInput(objectParams = {}) {
    const ri = {
      id: id.takeIdTag(),
      keyboard: [],
      mouse: [],
      mouseDirection: 0,
      lastSend: 0,
      sendInterval: 66.6666,
      nonInterp: {},
    };
    function mh(data) {
      // console.log(data);
      if (data.disconnect && this.remoteSend) { delete this.remoteSend; }
      if (data.keyCode) { this.keyboard[data.keyCode] = data.pos; }
      if (data.mb || data.mb === 0) { this.mouse[data.mb] = data.pos; }
      if (data.md || data.md === 0) {
        this.mouseDirection = data.md;
      }
    }
    ri.messageHandler = mh.bind(ri);
    utilities.veryShallowObjectMerge.call(ri, objectParams);
    return ri;
  },

  // constructor for viewport component
  createComponentViewport(objectParams = {}) {
    const vp = utilities.veryShallowObjectMerge.call({
      startX: 0,
      startY: 0,
      endX: 1,
      endY: 1,
    }, objectParams);
    vp.parent = objectParams.parent;
    return vp;
  },

  // constructor for laser object
  createHitscan(game,
    startX,
    startY,
    endX,
    endY,
    color,
    owner,
    collisionFunction,
    collisionProperties,
    objId,
  ) {
    const hitscan = {
      startX,
      startY,
      endX,
      endY,
      color,
      // previousLaser:previousLaser,
      owner,
      id: objId,
      velocityX: owner.velocityX,
      velocityY: owner.velocityY,
      collisionFunction,
      type: 'hitscan',
    };

    if (collisionProperties) utilities.veryShallowObjectMerge.call(hitscan, collisionProperties);
    // lsr.nextLaser = constructors.createNextLaserObject(lsr)
    if (game.hitscans) game.hitscans.push(hitscan);
    return hitscan;
  },

  // constructor for projectile object
  createProjectile(
    game,
    startX,
    startY,
    velX,
    velY,
    destructible,
    color,
    owner,
    visible,
    collisionFunction,
  ) {
    const prj = {
      id: id.takeIdTag(),
      cullTolerance: 0.3,
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      velocityX: velX,
      velocityY: velY,
      destructible,
      color,
      owner,
      visible,
      collisionFunction,
      type: 'prj',
    };
    game.projectiles.push(prj);
  },

  createRadial(game, x, y, vel, decay, color, owner, collisionFunction, collisionProperties) {
    const rad = {
      id: id.takeIdTag(),
      x,
      y,
      radius: 0,
      velocity: vel,
      decay,
      color,
      owner,
      collisionFunction,
      collisionProperties,
      type: 'radial',
    };
    game.radials.push(rad);
  },

  // returns a camera object with the given values and the context from the given canvas
  createCamera(canvas, objectParams = {}) {
    const cam = {
      x: (objectParams.x) ? objectParams.x : 0,
      y: (objectParams.y) ? objectParams.y : 0,
      rotation: (objectParams.rotation) ? objectParams.rotation : 0,
      zoom: (objectParams.zoom) ? objectParams.zoom : 1,
      minZoom: (objectParams.minZoom) ? objectParams.minZoom : 0,
      maxZoom: (objectParams.maxZoom) ? objectParams.maxZoom : Number.MAX_VALUE,
      viewport: constructors.createComponentViewport(objectParams.viewport),
      get width() {
        return canvas.width;
      },
      get height() {
        return canvas.height;
      },
      ctx: canvas.getContext('2d'),
    };
    return cam;
  },

  // generates the field of asteroids
  makeAsteroids(game, grid) {
    const asteroids = game.asteroids;
    const lower = [grid.gridStart[0], grid.gridStart[1]];
    const upper = [
      lower[0] + (grid.gridLines * grid.gridSpacing),
      lower[1] + (grid.gridLines * grid.gridSpacing),
    ];
    const maxRadius = 1000;
    const minRadius = 100;
    // asteroids.objs = [];
    for (let c = asteroids.objs.length; c < asteroids.total; c++) {
      const radius = (Math.random() * (maxRadius - minRadius)) + minRadius;
      const group = Math.floor(Math.random() * this.asteroids.colors.length);
      asteroids.objs.push({
        id: id.takeIdTag(),
        x: (Math.random() * (upper[0] - lower[0])) + lower[0],
        y: (Math.random() * (upper[1] - lower[1])) + lower[1],
        radius, // graphical radius
        destructible: new componentClasses.Destructible({
          hp: (radius * radius) / 300,
          radius, // collider radius
        }),
        colorIndex: group,
        game,
        type: 'asteroid',
        onDestroy: [(asteroid) => {
          id.returnIdTag(asteroid.id);
          constructors.makeAsteroids.call(asteroid.game, asteroid.game, asteroid.game.grid);
        }],
      });
    }
  },

  // generates a field of stars - same as above, but without the destructibles
  generateStarField(stars) {
    const lower = -10000000;
    const upper = 10000000;
    const maxRadius = 8000;
    const minRadius = 2000;
    for (let c = 0; c < 500; c++) {
      const group = Math.floor(Math.random() * stars.colors.length);
      stars.objs.push({
        x: (Math.random() * (upper - lower)) + lower,
        y: (Math.random() * (upper - lower)) + lower,
        radius: (Math.random() * (maxRadius - minRadius)) + minRadius,
        colorIndex: group,
      });
    }
  },
};

module.exports.content = constructors;
