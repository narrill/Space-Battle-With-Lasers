const ColorHSL = require('./utilities.js').ColorHSL;

class NetworkObj {
  constructor(obj) {
    const dest = obj.destructible;
    const ts = obj.thrusterSystem;
    this.id = obj.id;
    this.x = obj.x;
    this.y = obj.y;
    this.rotation = obj.rotation;
    this.radius = obj.radius;
    this.shp = obj.shp;
    this.shc = obj.shc;
    this.hp = obj.hp;
    this.color = obj.color;
    this.medial = obj.medial;
    this.lateral = obj.lateral;
    this.rotational = obj.rotational;
    this.thrusterColor = obj.thrusterColor;
  }
}

NetworkObj.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'rotation', type: 'Float32' },
  { key: 'radius', type: 'Float32' },
  { key: 'shp', type: 'Float32' },
  { key: 'shc', type: 'Float32' },
  { key: 'hp', type: 'Float32' },
  { key: 'color', type: ColorHSL },
  { key: 'medial', type: 'Float32' },
  { key: 'lateral', type: 'Float32' },
  { key: 'rotational', type: 'Float32' },
  { key: 'thrusterColor', type: ColorHSL },
];

module.exports = NetworkObj;