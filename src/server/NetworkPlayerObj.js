class NetworkPlayerObj {
  constructor(obj) {
    const stab = obj.stabilizer;
    const ps = obj.powerSystem;
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
  { key: 'clampMedial', type: 'Float32' },
  { key: 'clampLateral', type: 'Float32' },
  { key: 'clampRotational', type: 'Float32' },
  { key: 'clampEnabled', type: 'Uint8' },
  { key: 'stabilized', type: 'Uint8' },
  { key: 'thrusterPower', type: 'Float32' },
  { key: 'weaponPower', type: 'Float32' },
  { key: 'shieldPower', type: 'Float32' },
];

module.exports = NetworkPlayerObj;