const id = require('./id.js');
const Mobile = require('./Mobile.js');
const NetworkPrj = require('./NetworkPrj.js');
const utilities = require('./utilities.js');

class Prj extends Mobile {
  constructor(
    game,
    startX,
    startY,
    velX,
    velY,
    destructible,
    decayTimeSeconds,
    color,
    owner,
    collisionFunction,
  ) {
    super();
    this.game = game;
    this.id = id.takeIdTag();
    this.cullTolerance = 0.3;
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.velocityX = velX;
    this.velocityY = velY;
    this.destructible = destructible;
    this.decayTimeSeconds = decayTimeSeconds;
    this.color = color;
    this.owner = owner;
    this.collisionFunction = collisionFunction;
    this.type = 'prj';
  }

  update(dt) {
    super.update(dt);
    this.destructible.hp -= this.destructible.maxHp * (dt / this.decayTimeSeconds);
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
    return new NetworkPrj(transformedParams);
  }
}

module.exports = Prj;
