// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/gameFunctions.js

const dependencyCatch = require('./dependencyCatch.js');
const constructors = dependencyCatch(require('./constructors.js'));
const Obj = require('./Obj.js');
const utilities = require('./utilities.js');
const clearFunctions = require('./clearFunctions.js');
const SpatialHash = require('./SpatialHash.js');
const ReportQueue = require('./ReportQueue.js');
const updaters = dependencyCatch(require('./updaters.js'));
const ships = require('./ships.js');
const collisions = require('./collisions.js');

class Game {
  constructor() {
    // initialize properties
    this.accumulator = 0;
    this.timeStep = 0.0167;
    this.lastTime = 0; // used by calculateDeltaTime()
    this.objs = [];
    this.maxNPCs = 20;
    this.factions = 4;
    this.respawnQueue = [];
    this.factionColors = [];
    this.hitscans = [];
    this.projectiles = [];
    this.radials = [];
    this.reportQueue = new ReportQueue();
    this.functionQueue = [];
    this.socketSubscriptions = {};
    this.grid = {
      gridLines: 500, // number of grid lines
      gridSpacing: 100, // pixels per grid unit
      gridStart: [-25000, -25000], // corner anchor in world coordinates
      colors: [
        {
          color: '#1111FF',
          interval: 1000,
        },
        {
          color: 'blue',
          interval: 200,
        },
        {
          color: 'mediumblue',
          interval: 50,
          minimap: true,
        },
        {
          color: 'darkblue',
          interval: 10,
        },
        {
          color: 'navyblue',
          interval: 2,
        },
      ]
    };
    this.spatialHash = new SpatialHash();
    this.asteroids = {
      total: 60,
      colors: [
        '#6B2A06',
        'sienna',
      ],
      objs: []
    };
    constructors.makeAsteroids.bind(this, this, this.grid)();
    let hue = Math.round(Math.random() * 360);
    for (let c = 0; c < this.factions; c++) {
      this.factionColors[c] = `hsl(${hue},100%,65%)`;
      hue += 360 / this.factions;
      if (hue >= 360) { hue -= 360; }
    }
    for (let c = 0; c < this.maxNPCs; c++) {
      const newShip = utilities.deepObjectMerge.call(
        {},
        (Math.random() >= 0.5) ? ships.gull : ships.cheetah,
      );
      newShip.ai = {
        aiFunction: 'basic',
        followMin: 2500,
        followMax: 3000,
        accuracy: 0.5,
        fireSpread: 5,
      };
      newShip.faction = -1;
      newShip.respawnTime = 5;
      this.objs.push(new Obj(newShip, this));
    } 
    this.lastTime = Date.now();
    this.elapsedGameTime = 0;
  }

  loop() {
    this.frameTimeout = setTimeout(this.loop.bind(this), this.timeStep * 500);
    let dt = utilities.calculateDeltaTime.call(this);

    if (dt > this.timeStep * 4) {
      console.log('server throttle');
      dt = this.timeStep;
    }
    this.accumulator += dt;
    while (this.accumulator >= this.timeStep) {
      this.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }
  }

  // one game tick
  update(dt) {
    // clear values
    this.hitscans.length = 0;
    clearFunctions.clearDestructibles(this.asteroids.objs);
    clearFunctions.clearDestructibles(this.objs);
    clearFunctions.clearDestructibles(this.projectiles);
    clearFunctions.cullDestructibles(this.objs, this.grid);
    clearFunctions.clearRadials(this.radials);

    for (let c = 0; c < this.respawnQueue.length; c++) {
      const rs = this.respawnQueue[c];
      if (this.elapsedGameTime >= rs.time) {
        this.objs.push(new Obj(rs.params, this));
        this.respawnQueue.splice(c--, 1);
      }
    }
    for (let c = 0; c < this.asteroids.objs.length; c++) {
      this.reportQueue.push(this.asteroids.objs[c]);
    }

    // update ship, center main camera on ship
    // this.updateShip(this.ship,dt);
    for (let i = 0; i < this.projectiles.length; i++) {
      updaters.updateMobile.call(this.projectiles[i], dt);
      updaters.updatePrj.call(this.projectiles[i], dt);
      this.reportQueue.push(this.projectiles[i]);
    }
    for (let i = 0; i < this.radials.length; i++) {
      updaters.updateRadial.call(this.radials[i], dt);
      this.reportQueue.push(this.radials[i]);
    }
    this.objs.forEach((ship) => {
      updaters.updateUpdatable.call(ship, dt);
    }, this);


    for (let i = 0; i < this.hitscans.length; i++) {
      this.reportQueue.push(this.hitscans[i]);
    }

    this.processReportQueue(dt);

    this.checkCollisions(dt);

    for (let c = 0; c < this.functionQueue.length; c++) {
      this.functionQueue[c]();
      this.functionQueue.splice(c--, 1);
    }

    this.elapsedGameTime += dt * 1000;

    // because we might use the frame count for something at some point
    this.frameCount++;
  }

  checkCollisions(dt) {
    // obj collisions
    for (let i = 0; i < this.objs.length; i++) {
      const currentObj = this.objs[i];
      const currentObjCapsule = new utilities.VelocityCapsule(currentObj, dt);

      for (let c = i + 1; c < this.objs.length; c++) {
        const gameObj = this.objs[c];

        if (!(currentObj.specialProperties && gameObj === currentObj.specialProperties.owner)
          && !(gameObj.specialProperties && currentObj === gameObj.specialProperties.owner)) {
          const distanceSqr = Math.abs(
            ((currentObj.x - gameObj.x) * (currentObj.x - gameObj.x))
            + ((currentObj.y - gameObj.y) * (currentObj.y - gameObj.y)),
          );

          if (distanceSqr <= 5
            * (currentObj.destructible.radius + gameObj.destructible.radius)
            * (currentObj.destructible.radius + gameObj.destructible.radius)) {
            const objCapsule = new utilities.VelocityCapsule(gameObj, dt);
            if (utilities.capsuleCapsuleSAT(objCapsule, currentObjCapsule)) {
              collisions.basicKineticCollision(currentObj, gameObj, dt);
            }
          }
        }
      }

      const projectiles = this.spatialHash.fetch(
        [currentObj.x, currentObj.y],
        currentObj.destructible.radius,
        { prj: [] },
      );

      //console.log(`ID ${currentObj.id}, ${projectiles.prj.length} prjs`);

      for (let c = 0; c < projectiles.prj.length; c++) {
        const prj = projectiles.prj[c];
        if (currentObj !== prj.owner) {
          const prjCapsule = new utilities.VelocityCapsule(prj, dt);
          if (utilities.capsuleCapsuleSAT(currentObjCapsule, prjCapsule)) {
            prj.collisionFunction(prj, currentObj, dt);
          }
        }
      }
    }

    // hitscan collisions
    for (let n = 0; n < this.hitscans.length; n++) {
      const hitscan = this.hitscans[n];
      let obj; // the chosen object
      let tValOfObj = Number.MAX_VALUE;
      const xInv = hitscan.endX < hitscan.startX;
      const yInv = hitscan.endY < hitscan.startY;
      const start = [
        (xInv) ? hitscan.endX : hitscan.startX,
        (yInv) ? hitscan.endY : hitscan.startY,
      ];
      const end = [
        (xInv) ? hitscan.startX : hitscan.endX,
        (yInv) ? hitscan.startY : hitscan.endY,
      ];
      const hitscanVertices = [
        [hitscan.startX, hitscan.startY],
        [hitscan.endX, hitscan.endY],
        [hitscan.endX + (hitscan.velocityX * dt), hitscan.endY + (hitscan.velocityY * dt)],
        [hitscan.startX + (hitscan.velocityX * dt), hitscan.startY + (hitscan.velocityY * dt)],
      ];

      // hitscan-asteroid
      for (let c = 0; c < this.asteroids.objs.length; c++) {
        const gameObj = this.asteroids.objs[c];
        if (!(gameObj.x + gameObj.destructible.radius < start[0]
          || gameObj.x - gameObj.destructible.radius > end[0]
          || gameObj.y + gameObj.destructible.radius < start[1]
          || gameObj.y - gameObj.destructible.radius > end[1])) {
          const gameDistance = utilities.distanceFromPointToLine(
            gameObj.x,
            gameObj.y,
            hitscan.startX,
            hitscan.startY,
            hitscan.endX,
            hitscan.endY,
          );
          if (gameDistance[0] < gameObj.destructible.radius && gameDistance[1] < tValOfObj) {
            obj = gameObj;
            tValOfObj = gameDistance[1];
          }
        }
      }

      // hitscan-ship
      for (let c = 0; c < this.objs.length; c++) {
        const gameObj = this.objs[c];
        if (!(gameObj === hitscan.owner
          || gameObj.x + gameObj.destructible.radius < start[0]
          || gameObj.x - gameObj.destructible.radius > end[0]
          || gameObj.y + gameObj.destructible.radius < start[1]
          || gameObj.y - gameObj.destructible.radius > end[1])) {
          const gameDistance = utilities.distanceFromPointToLine(
            gameObj.x,
            gameObj.y,
            hitscan.startX,
            hitscan.startY,
            hitscan.endX,
            hitscan.endY,
          );
          const objCapsule = new utilities.VelocityCapsule(gameObj, dt);
          if (gameDistance[1] < tValOfObj
            && utilities.polygonCapsuleSAT(hitscanVertices, objCapsule)) {
            obj = gameObj;
            tValOfObj = gameDistance[1];
          }
        }
      }

      // hitscan-projectile
      for (let c = 0; c < this.projectiles.length; c++) {
        const gameObj = this.projectiles[c];
        if (!(gameObj === hitscan.owner
          || gameObj.x + gameObj.destructible.radius < start[0]
          || gameObj.x - gameObj.destructible.radius > end[0]
          || gameObj.y + gameObj.destructible.radius < start[1]
          || gameObj.y - gameObj.destructible.radius > end[1])) {
          const gameDistance = utilities.distanceFromPointToLine(
            gameObj.x,
            gameObj.y,
            hitscan.startX,
            hitscan.startY,
            hitscan.endX,
            hitscan.endY,
          );
    
          const objCapsule = new utilities.VelocityCapsule(gameObj, dt);

          if (gameDistance[1] < tValOfObj
            && utilities.polygonCapsuleSAT(hitscanVertices, objCapsule)) {
            obj = gameObj;
            tValOfObj = gameDistance[1];
            // console.log('hitscan-projectile collision');
          }
        }
      }

      // resolve collision
      if (obj) {
        hitscan.collisionFunction(hitscan, obj, tValOfObj, dt);
        const hitscanDir = [hitscan.endX - hitscan.startX, hitscan.endY - hitscan.startY];
        const newEnd = [
          hitscan.startX + (tValOfObj * hitscanDir[0]),
          hitscan.startY + (tValOfObj * hitscanDir[1]),
        ];
        hitscan.endX = newEnd[0];
        hitscan.endY = newEnd[1];
      }
    }

    // projectile collisions
    for (let n = 0; n < this.projectiles.length; n++) {
      const prj = this.projectiles[n];
      const prjCapsule = new utilities.VelocityCapsule(prj, dt);

      // projectile-asteroid
      for (let c = 0; c < this.asteroids.objs.length; c++) {
        const gameObj = this.asteroids.objs[c];
        const dotX = (prj.x - gameObj.x) * (prj.x - gameObj.x);
        const dotY = (prj.y - gameObj.y) * (prj.y - gameObj.y);
        const distanceSqr = Math.abs(dotX + dotY);
        const radiiSum = prj.destructible.radius + gameObj.destructible.radius;
        if (distanceSqr <= radiiSum * radiiSum) {
          prj.collisionFunction(prj, gameObj, dt);
        }
      }
    }

    // asteroid collisions
    for (let c = 0; c < this.objs.length; c++) {
      const ship = this.objs[c];
      for (let n = 0; n < this.asteroids.objs.length; n++) {
        const asteroid = this.asteroids.objs[n];
        const distance = ((ship.x - asteroid.x) * (ship.x - asteroid.x))
          + ((ship.y - asteroid.y) * (ship.y - asteroid.y));
        const overlap = ((ship.destructible.radius + asteroid.radius)
          * (ship.destructible.radius + asteroid.radius))
          - distance;
        if (overlap >= 0) {
          if (this.frameCount < 25) { asteroid.destructible.hp = -1; } else {
            const objectSpeed = Math.sqrt((ship.velocityX * ship.velocityX)
              + (ship.velocityY * ship.velocityY));
            ship.destructible.shield.current -= 0.1 * dt * objectSpeed;
            asteroid.destructible.hp -= 0.2 * dt * objectSpeed;
            if (ship.destructible.shield.current < 0) {
              ship.destructible.hp += ship.destructible.shield.current;
              ship.destructible.shield.current = 0;
            }
            ship.velocityX *= (1 - (2 * dt));
            ship.velocityY *= (1 - (2 * dt));
          }
        }
      }
    }

    // radial collisions
    for (let n = 0; n < this.radials.length; n++) {
      const rad = this.radials[n];
      for (let c = 0; c < this.objs.length; c++) {
        const gameObj = this.objs[c]; // lol
        
        const circleInner = { center: [rad.x, rad.y], radius: rad.radius };
        const circleOuter = { center: [rad.x, rad.y], radius: rad.radius + (rad.velocity * dt) };
        
        const capsule = new utilities.VelocityCapsule(gameObj, dt);
        if (utilities.circleCapsuleSAT(circleOuter, capsule)
          && !utilities.isCapsuleWithinCircle(circleInner, capsule)) {
          rad.collisionFunction(rad, gameObj, dt);
        }
      }
    }
  }

  queueFunction(f) {
    this.functionQueue.push(f);
  }

  processReportQueue(dt) {
    this.spatialHash.processReportQueue(this.reportQueue, dt);
    this.reportQueue.clear();
  }
}

module.exports = Game;