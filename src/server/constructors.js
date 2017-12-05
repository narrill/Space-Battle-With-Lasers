// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/constructors.js

const id = require('./id.js');
const utilities = require('./utilities.js');
const componentClasses = require('./ComponentTypes.js').classes;

const constructors = {
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
      get x() {
        return startX;
      },
      get y() {
        return startY;
      },
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
