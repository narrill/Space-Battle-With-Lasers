class NetworkPlayerObj {
  constructor(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.velocityX = obj.velocityX;
    this.velocityY = obj.velocityY;
    this.rotation = obj.rotation;
    this.rotationalVelocity = obj.rotationalVelocity;
    this.clampMedial = obj.clampMedial;
    this.clampLateral = obj.clampLateral;
    this.clampRotational = obj.clampRotational;
    this.clampEnabled = obj.clampEnabled;
    this.stabilized = obj.stabilized;
    this.thrusterPower = obj.thrusterPower;
    this.weaponPower = obj.weaponPower;
    this.shieldPower = obj.shieldPower;
  }
}

NetworkPlayerObj.serializableProperties = [
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocityX', type: 'Float32' },
  { key: 'velocityY', type: 'Float32' },
  { key: 'rotation', type: 'Float32' },
  { key: 'rotationalVelocity', type: 'Float32' },
  { key: 'clampMedial', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampLateral', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampRotational', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampEnabled', type: 'Uint8' },
  { key: 'stabilized', type: 'Uint8' },
  { key: 'thrusterPower', type: 'Uint8', scaleFactor: 255 },
  { key: 'weaponPower', type: 'Uint8', scaleFactor: 255 },
  { key: 'shieldPower', type: 'Uint8', scaleFactor: 255 },
];

module.exports = NetworkPlayerObj;
