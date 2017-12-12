const ColorHSL = require('./utilities.js').ColorHSL;

class NetworkHitscan {
  constructor(hitscan) {
    this.id = hitscan.id;
    this.startX = hitscan.startX;
    this.startY = hitscan.startY;
    this.endX = hitscan.endX;
    this.endY = hitscan.endY;
    this.color = hitscan.color;
    this.power = hitscan.power;
    this.efficiency = hitscan.efficiency;
  }
}

NetworkHitscan.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'startX', type: 'Float32' },
  { key: 'startY', type: 'Float32' },
  { key: 'endX', type: 'Float32' },
  { key: 'endY', type: 'Float32' },
  { key: 'color', type: ColorHSL },
  { key: 'power', type: 'Uint16' },
  { key: 'efficiency', type: 'Uint16' },
];

module.exports = NetworkHitscan;
