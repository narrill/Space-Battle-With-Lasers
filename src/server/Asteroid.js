const id = require('./id.js');
const Destructible = require('./Components/Destructible.js');
const NetworkAsteroid = require('./NetworkAsteroid.js');
const utilities = require('./utilities.js');

class Asteroid {
  constructor(game, x, y, radius, colorIndex) {
    this.game = game;
    this.id = id.takeIdTag();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colorIndex = colorIndex;
    this.destructible = new Destructible(Destructible.getBP({
      hp: (radius * radius) / 300,
      radius,
    }));
    this.type = 'asteroid';
  }

  update() {
    this.game.reportQueue.push(this);
  }

  get shouldDestroy() {
    return this.destructible.isDead;
  }

  destroy() {
    id.returnIdTag(this.id);
  }

  get networkRepresentation() {
    const transformedParams = {
      radius: this.destructible.radius,
    };
    utilities.shallowObjectMerge.call(transformedParams, this);
    return new NetworkAsteroid(transformedParams);
  }

  static makeAsteroids(game) {
    const grid = game.grid;
    const asteroids = game.asteroids;
    const lower = [grid.gridStart[0], grid.gridStart[1]];
    const upper = [
      lower[0] + (grid.gridLines * grid.gridSpacing),
      lower[1] + (grid.gridLines * grid.gridSpacing),
    ];
    const maxRadius = 1000;
    const minRadius = 100;

    for (let c = asteroids.objs.length; c < asteroids.total; c++) {
      const radius = (Math.random() * (maxRadius - minRadius)) + minRadius;
      const group = Math.floor(Math.random() * asteroids.colors.length);
      const x = (Math.random() * (upper[0] - lower[0])) + lower[0];
      const y = (Math.random() * (upper[1] - lower[1])) + lower[1];
      game.createAsteroid(game, x, y, radius, group);
    }
  }
}

module.exports = Asteroid;
