// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/gameFunctions.js

const dependencyCatch = require('./dependencyCatch.js');
const constructors = dependencyCatch(require('./constructors.js'));
const SuperArray = require('./SuperArray.js');
const utilities = require('./utilities.js');
const clearFunctions = require('./clearFunctions.js');
const mapFunctions = require('./mapFunctions.js');
const updaters = dependencyCatch(require('./updaters.js'));
const ships = require('./ships.js');
const collisions = require('./collisions.js');

const gameFunctions = {
  // initialize the stuff
  init() {
    // initialize properties
    // constructors.generateStarField.bind(this, this.stars)();
    constructors.makeAsteroids.bind(this, this, this.grid)();
    // this.ship = constructors.createShip(ships.cheetah, this);
    this.reportQueue = new SuperArray();
    this.tileArray = new SuperArray();
    this.tileArray.min = [Number.MAX_VALUE, Number.MAX_VALUE];
    this.tileArray.max = [-Number.MAX_VALUE, -Number.MAX_VALUE];
    this.tileArray.map = { position: [0, 0], size: [0, 0], precision: 0 };
    let hue = Math.round(Math.random() * 360);
    for (let c = 0; c < this.factions; c++) {
      this.factionColors[c] = `hsl(${hue},100%,65%)`;
      hue += 360 / this.factions;
      if (hue >= 360) { hue -= 360; }
    }
    for (let c = 0; c < this.maxOtherShips; c++) {
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
      this.otherShips.push(constructors.createShip(newShip, this));
    }
    // start the this loop    
    this.lastTime = Date.now();
    this.elapsedGameTime = 0;
    gameFunctions.loop.bind(this)();
    return this;
  },

  // the main this function - called once per frame
  loop() {
    // this.animationID = requestAnimationFrame(gameFunctions.frame.bind(this));
    this.frameTimeout = setTimeout(gameFunctions.loop.bind(this), this.timeStep * 500);
    let dt = utilities.calculateDeltaTime.call(this);

    if (dt > this.timeStep * 4) {
      console.log('server throttle');
      dt = this.timeStep;
    }
    this.accumulator += dt;
    while (this.accumulator >= this.timeStep) {
      gameFunctions.update.call(this, this.timeStep);
      this.accumulator -= this.timeStep;
    }
    // gameFunctions.draw(this, dt);
  },

  // one game tick
  update(dt) {
    // clear values
    this.hitscans.length = 0;
    clearFunctions.clearDestructibles(this.asteroids.objs);
    clearFunctions.clearDestructibles(this.otherShips);
    clearFunctions.clearDestructibles(this.updatables);
    clearFunctions.clearDestructibles(this.projectiles);
    clearFunctions.cullDestructibles(this.projectiles, this.grid);
    clearFunctions.cullDestructibles(this.otherShips, this.grid);
    clearFunctions.clearRadials(this.radials);

    for (let c = 0; c < this.respawnQueue.length; c++) {
      const rs = this.respawnQueue[c];
      if (this.elapsedGameTime >= rs.time) {
        this.otherShips.push(constructors.createShip(rs.params, this));
        this.respawnQueue.splice(c--, 1);
      }
    }
    for (let c = 0; c < this.asteroids.objs.length; c++) {
      updaters.queueReport.call(this.asteroids.objs[c]);
    }

    // update ship, center main camera on ship
    // this.updateShip(this.ship,dt);
    for (let i = 0; i < this.projectiles.length; i++) {
      updaters.updateMobile.call(this.projectiles[i], dt);
      updaters.updatePrj.call(this.projectiles[i], dt);
      updaters.queueReport.call(this.projectiles[i]);
    }
    for (let i = 0; i < this.radials.length; i++) {
      updaters.updateRadial.call(this.radials[i], dt);
      updaters.queueReport.call(this.radials[i]);
    }
    // updaters.updateUpdatable(this.ship,dt);
    // console.log(this.otherShips.length);
    this.otherShips.forEach((ship) => {
      updaters.updateUpdatable.call(ship, dt);
    }, this);


    for (let i = 0; i < this.hitscans.length; i++) {
      updaters.queueReport.call(this.hitscans[i]);
    }

    gameFunctions.processReportQueue.call(this, dt);

    gameFunctions.checkCollisions(this, dt);

    for (let c = 0; c < this.functionQueue.length; c++) {
      this.functionQueue[c]();
      this.functionQueue.splice(c--, 1);
    }

    this.elapsedGameTime += dt * 1000;

    // because we might use the frame count for something at some point
    this.frameCount++;
  },

  checkCollisions: (game, dt) => {
    // obj collisions
    // var resolvedCollisions = [];
    for (let i = 0; i < game.otherShips.length; i++) {
      const currentObj = game.otherShips[i];

      const currentObjNext = [
        currentObj.x + (currentObj.velocityX * dt),
        currentObj.y + (currentObj.velocityY * dt),
      ];

      const currentObjCapsule = {
        center1: [currentObj.x, currentObj.y],
        center2: currentObjNext,
        radius: currentObj.destructible.radius,
      };

      for (let c = i + 1; c < game.otherShips.length; c++) {
        const gameObj = ((c === -1) ? game.ship : game.otherShips[c]);

        if (!(currentObj.specialProperties && gameObj === currentObj.specialProperties.owner)
          && !(gameObj.specialProperties && currentObj === gameObj.specialProperties.owner)) {
          const gameObjNext = [
            gameObj.x + (gameObj.velocityX * dt),
            gameObj.y + (gameObj.velocityY * dt),
          ];
          const distanceSqr = Math.abs(
            ((currentObj.x - gameObj.x) * (currentObj.x - gameObj.x))
            + ((currentObj.y - gameObj.y) * (currentObj.y - gameObj.y)),
          );

          if (distanceSqr <= 5
            * (currentObj.destructible.radius + gameObj.destructible.radius)
            * (currentObj.destructible.radius + gameObj.destructible.radius)) {
            const objCapsule = {
              center1: [gameObj.x, gameObj.y],
              center2: gameObjNext,
              radius: gameObj.destructible.radius,
            };
            if (utilities.capsuleCapsuleSAT(objCapsule, currentObjCapsule)) {
              collisions.basicKineticCollision(currentObj, gameObj, dt);
            }
          }
        }
      }
      const projectiles = gameFunctions.fetchFromTileArray(
        game,
        [currentObj.x, currentObj.y],
        currentObj.destructible.radius,
        { prj: [] },
      );
      let prj;
      const prjNext = [];
      let prjCapsule;
      for (let c = 0; c < projectiles.prj.length; c++) {
        prj = projectiles.prj[c];
        if (currentObj !== prj.owner) {
          prjNext[0] = prj.x + (prj.velocityX * dt);
          prjNext[1] = prj.y + (prj.velocityY * dt);
          prjCapsule = {
            center1: [prj.x, prj.y],
            center2: prjNext,
            radius: prj.destructible.radius,
          };
          const objCapsule = {
            center1: [currentObj.x, currentObj.y],
            center2: currentObjNext,
            radius: currentObj.destructible.radius,
          };
          if (utilities.capsuleCapsuleSAT(objCapsule, prjCapsule)) {
            prj.collisionFunction(prj, currentObj, dt);
          }
        }
      }
    }

    // hitscan collisions
    for (let n = 0; n < game.hitscans.length; n++) {
      const hitscan = game.hitscans[n];
      if (hitscan.power > 0) {
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
        for (let c = 0; c < game.asteroids.objs.length; c++) {
          const gameObj = game.asteroids.objs[c];
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
        for (let c = 0; c < game.otherShips.length; c++) {
          const gameObj = game.otherShips[c]; // lol
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
            const objCapsule = {
              center1: [gameObj.x, gameObj.y],
              center2: [
                gameObj.x + (gameObj.velocityX * dt),
                gameObj.y + (gameObj.velocityY * dt),
              ],
              radius: gameObj.destructible.radius,
            };
            if (gameDistance[1] < tValOfObj
              && utilities.polygonCapsuleSAT(hitscanVertices, objCapsule)) {
              obj = gameObj;
              tValOfObj = gameDistance[1];
            }
          }
        }

        // hitscan-projectile
        for (let c = 0; c < game.projectiles.length; c++) {
          const gameObj = game.projectiles[c];
          const gameObjNext = [
            gameObj.x + (gameObj.velocityX * dt),
            gameObj.y + (gameObj.velocityY * dt),
          ];
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
            const objCapsule = {
              center1: [gameObj.x, gameObj.y],
              center2: gameObjNext,
              radius: gameObj.destructible.radius,
            };

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
    }

    // projectile collisions
    for (let n = 0; n < game.projectiles.length; n++) {
      const prj = game.projectiles[n];
      const prjNext = [prj.x + (prj.velocityX * dt), prj.y + (prj.velocityY * dt)];
      const prjCapsule = {
        center1: [prj.x, prj.y],
        center2: prjNext,
        radius: prj.destructible.radius,
      };
      // projectile-ship
      for (let c = 0; c < game.otherShips.length; c++) {
        const gameObj = game.otherShips[c]; // lol
        const gameObjNext = [
          gameObj.x + (gameObj.velocityX * dt),
          gameObj.y + (gameObj.velocityY * dt),
        ];
        if (gameObj !== prj.owner) {
          const dotX = (prj.x - gameObj.x) * (prj.x - gameObj.x);
          const dotY = (prj.y - gameObj.y) * (prj.y - gameObj.y);
          const distanceSqr = Math.abs(dotX + dotY);
          const radiiSum = prj.destructible.radius + gameObj.destructible.radius;
          if (distanceSqr <= 5 * radiiSum * radiiSum) {
            if (utilities.capsuleCapsuleSAT({
              center1: [gameObj.x, gameObj.y],
              center2: gameObjNext,
              radius: gameObj.destructible.radius,
            }, prjCapsule)) {
              prj.collisionFunction(prj, gameObj, dt);
            }
          }
        }
      }

      // projectile-asteroid
      for (let c = 0; c < game.asteroids.objs.length; c++) {
        const gameObj = game.asteroids.objs[c];
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
    for (let c = 0; c < game.otherShips.length; c++) {
      const ship = game.otherShips[c];
      for (let n = 0; n < game.asteroids.objs.length; n++) {
        const asteroid = game.asteroids.objs[n];
        const distance = ((ship.x - asteroid.x) * (ship.x - asteroid.x))
          + ((ship.y - asteroid.y) * (ship.y - asteroid.y));
        const overlap = ((ship.destructible.radius + asteroid.radius)
          * (ship.destructible.radius + asteroid.radius))
          - distance;
        if (overlap >= 0) {
          if (game.frameCount < 25) { asteroid.destructible.hp = -1; } else {
            const objectSpeed = Math.sqrt((ship.velocityX * ship.velocityX)
              + (ship.velocityY * ship.velocityY));
            ship.destructible.shield.current -= ((c === -1) ? 0.1 : 0.01) * dt * objectSpeed;
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
    for (let n = 0; n < game.radials.length; n++) {
      const rad = game.radials[n];
      for (let c = 0; c < game.otherShips.length; c++) {
        const gameObj = game.otherShips[c]; // lol
        const gameObjNext = [
          gameObj.x + (gameObj.velocityX * dt),
          gameObj.y + (gameObj.velocityY * dt),
        ];
        const circleInner = { center: [rad.x, rad.y], radius: rad.radius };
        const circleOuter = { center: [rad.x, rad.y], radius: rad.radius + (rad.velocity * dt) };
        const capsule = {
          center1: [gameObj.x, gameObj.y],
          center2: gameObjNext,
          radius: gameObj.destructible.radius,
        };
        if (utilities.circleCapsuleSAT(circleOuter, capsule)
          && !utilities.isCapsuleWithinCircle(circleInner, capsule)) {
          rad.collisionFunction(rad, gameObj, dt);
        }
      }
    }
  },

  queueFunction: (game, f) => {
    game.functionQueue.push(f);
  },

  processReportQueue() {
    const map = {};
    map.position = [this.tileArray.min[0] - 2, this.tileArray.min[1] - 2];
    map.size = [
      (this.tileArray.max[0] - this.tileArray.min[0]) + 4,
      (this.tileArray.max[1] - this.tileArray.min[1]) + 4,
    ];
    map.precision = 30000;
    const taSize = mapFunctions.posTo1dIndex(
      [map.position[0] + map.size[0], map.position[1] + map.size[1]],
      map,
    );
    for (let c = 0; c <= taSize; c++) {
      // console.log('adding tile '+c);
      if (c >= this.tileArray.count) {
        this.tileArray.push({
          asteroid: new SuperArray(),
          obj: new SuperArray(),
          prj: new SuperArray(),
          hitscan: new SuperArray(),
          radial: new SuperArray(),
        });
      } else {
        this.tileArray.get(c).asteroid.clear();
        this.tileArray.get(c).obj.clear();
        this.tileArray.get(c).prj.clear();
        this.tileArray.get(c).hitscan.clear();
        this.tileArray.get(c).radial.clear();
      }
    }
    let item;
    let currentIndex;
    let tiles = [];
    const mmfo = gameFunctions.getMinMaxFromObject;
    const taa = this.tileArray.array;
    const p21d = mapFunctions.posTo1dIndex;
    const rqArray = this.reportQueue.array;

    for (let c = 0, counter = this.reportQueue.count; c < counter; c++) {
      item = rqArray[c];
      const minMax = mmfo(item);
      const min = minMax[0];
      const max = minMax[1];
      tiles = [];
      if (item.x && item.y) {
        currentIndex = p21d(
          [(item.x) ? item.x : item.startX, (item.y) ? item.y : item.startY],
          map,
        );
        tiles[0] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
      currentIndex = p21d([min[0], min[1]], map);
      if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
        tiles[1] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
      currentIndex = p21d([min[0], max[1]], map);
      if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
        tiles[2] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
      currentIndex = p21d([max[0], min[1]], map);
      if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
        tiles[3] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
      currentIndex = p21d([max[0], max[1]], map);
      if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
        tiles[4] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
    }
    this.tileArray.map = map;
    this.reportQueue.clear();
    this.tileArray.min = [Number.MAX_VALUE, Number.MAX_VALUE];
    this.tileArray.max = [-Number.MAX_VALUE, -Number.MAX_VALUE];
  },

  fetchFromTileArray: (game, pos, radius, objList) => {
    const min = [pos[0] - radius, pos[1] - radius];
    const max = [pos[0] + radius, pos[1] + radius];
    const info = mapFunctions.minMaxToInfo(min, max, game.tileArray.map);
    const objectList = (objList) || {
      asteroid: [],
      obj: [],
      prj: [],
      hitscan: [],
      radial: [],
    };
    for (let row = 0; row < info.repetitions; row++) {
      for (let col = 0; col < info.len; col++) {
        const theTile = game.tileArray.get(info.start + col + (info.offset * row));
        if (theTile) {
          const keys = Object.keys(objectList);
          for (let n = 0; n < keys.length; n++) {
            const key = keys[n];
            for (let c = 0; c < theTile[key].count; c++) {
              objectList[key].push(theTile[key].get(c));
            }
          }
        }
      }
    }
    return objectList;
  },

  getMinMaxFromObject: (object, dt) => {
    const min = [];
    const max = [];
    if (object.type === 'hitscan') {
      min[0] = (object.startX < object.endX) ? object.startX : object.endX;
      min[1] = (object.startY < object.endY) ? object.startY : object.endY;
      max[0] = (object.startX > object.endX) ? object.startX : object.endX;
      max[1] = (object.startY > object.endY) ? object.startY : object.endY;
    } else if (object.type === 'radial') {
      const vel = Math.abs(object.velocity) * dt;
      min[0] = object.x - object.radius - vel;
      min[1] = object.y - object.radius - vel;
      max[0] = object.x + object.radius + vel;
      max[1] = object.y + object.radius + vel;
    } else {
      const velX = (object.velocityX) ? Math.abs(object.velocityX) * dt : 0;
      const velY = (object.velocityY) ? Math.abs(object.velocityY) * dt : 0;
      min[0] = object.x - object.destructible.radius - velX;
      min[1] = object.y - object.destructible.radius - velY;
      max[0] = object.x + object.destructible.radius + velX;
      max[1] = object.y + object.destructible.radius + velY;
    }
    return [min, max];
  },
};

module.exports.content = gameFunctions;
