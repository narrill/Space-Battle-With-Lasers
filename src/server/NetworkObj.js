const ColorHSL = require('./utilities.js').ColorHSL;

class NetworkObj {
  constructor(obj) {
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
  { key: 'rotation', type: 'Int16', scaleFactor: 50 },
  { key: 'radius', type: 'Uint16' },
  { key: 'shp', type: 'Uint16', scaleFactor: 100 },
  { key: 'shc', type: 'Uint16', scaleFactor: 100 },
  { key: 'hp', type: 'Uint16', scaleFactor: 100 },
  { key: 'color', type: ColorHSL },
  { key: 'medial', type: 'Int16', scaleFactor: 10 },
  { key: 'lateral', type: 'Int16', scaleFactor: 10 },
  { key: 'rotational', type: 'Int16', scaleFactor: 10 },
  { key: 'thrusterColor', type: ColorHSL },
];

module.exports = NetworkObj;
