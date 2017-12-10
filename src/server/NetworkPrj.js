const ColorRGB = require('./utilities.js').ColorRGB;

class NetworkPrj {
  constructor(prj) {
    this.id = prj.id;
    this.x = prj.x;
    this.y = prj.y;
    this.velocityX = prj.velocityX;
    this.velocityY = prj.velocityY;
    this.color = prj.color;
    this.radius = prj.radius;
  }
}

NetworkPrj.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocityX', type: 'Float32' },
  { key: 'velocityY', type: 'Float32' },
  { key: 'color', type: ColorRGB },
  { key: 'radius', type: 'Float32' },
];

module.exports = NetworkPrj;