const utilities = require('./utilities.js');

class Hitscan {
  constructor(
    game,
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
    this.game = game;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    // previousLaser:previousLaser,
    this.owner = owner;
    this.id = objId;
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
    return {
      id: this.id,
      startX: this.startX,
      startY: this.startY,
      endX: this.endX,
      endY: this.endY,
      color: this.color,
      power: this.power,
      efficiency: this.efficiency,
    };
  }

  get x() {
    return this.startX;
  }
  get y() {
    return this.startY;
  }
}

module.exports = Hitscan;
