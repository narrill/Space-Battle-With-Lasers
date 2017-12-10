class NetworkPrj {
  constructor(prj) {
    this.id = prj.id;
    this.x = prj.x;
    this.y = prj.y;
    this.velocityX = prj.velocityX;
    this.velocityY = prj.velocityY;
    this.color = prj.color;
    this.radius = prj.destructible.radius;
  }
}

module.exports = NetworkPrj;