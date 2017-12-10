const id = require('./id.js');
const Mobile = require('./Mobile.js');
const NetworkPrj = require('./NetworkPrj.js');

class Prj extends Mobile {
  constructor(
    game,
    startX,
    startY,
    velX,
    velY,
    destructible,
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
    this.color = color;
    this.owner = owner;
    this.collisionFunction = collisionFunction;
    this.type = 'prj';
  }

  update(dt) {
    super.update(dt);
    this.destructible.hp -= this.destructible.maxHp * 2.5 * dt;
    this.game.reportQueue.push(this);
  }

  get shouldDestroy() {
    return this.destructible.isDead;
  }

  destroy() {
    id.returnIdTag(this.id);
  }

  get networkRepresentation() {
    return new NetworkPrj(this);
  }
}

module.exports = Prj;
