const ColorRGB = require('./utilities.js').ColorRGB;

class NetworkRadial {
  constructor(radial) {
    this.id = radial.id;
    this.x = radial.x;
    this.y = radial.y;
    this.velocity = radial.velocity;
    this.radius = radial.radius;
    this.color = radial.color;
  }
}

NetworkRadial.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocity', type: 'Float32' },
  { key: 'radius', type: 'Uint16' },
  { key: 'color', type: ColorRGB },
];

module.exports = NetworkRadial;
