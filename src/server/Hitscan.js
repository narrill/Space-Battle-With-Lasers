const utilities = require('./utilities.js');
const NetworkHitscan = require('./NetworkHitscan.js');

class Hitscan {
  constructor(
    game,
    id,
    startX,
    startY,
    endX,
    endY,
    color,
    owner,
    collisionFunction,
    collisionProperties,
  ) {
    this.game = game;
    this.id = id;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    // previousLaser:previousLaser,
    this.owner = owner;
    this.velocityX = owner.velocityX;
    this.velocityY = owner.velocityY;
    this.collisionFunction = collisionFunction;
    this.type = 'hitscan';

    if (collisionProperties) utilities.veryShallowObjectMerge.call(this, collisionProperties);
  }

  update() {
    this.game.reportQueue.push(this);
  }

  get networkRepresentation() {
    return new NetworkHitscan(this);
  }

  get x() {
    return this.startX;
  }
  get y() {
    return this.startY;
  }
}

module.exports = Hitscan;
