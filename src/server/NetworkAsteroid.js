class NetworkAsteroid {
  constructor(asteroid) {
    this.id = asteroid.id;
    this.x = asteroid.x;
    this.y = asteroid.y;
    this.colorIndex = asteroid.colorIndex;
    this.radius = asteroid.radius;
  }
}

NetworkAsteroid.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'colorIndex', type: 'Uint8' },
  { key: 'radius', type: 'Uint16' },
];

module.exports = NetworkAsteroid;
