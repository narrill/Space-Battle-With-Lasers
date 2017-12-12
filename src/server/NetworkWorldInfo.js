const NetworkObj = require('./NetworkObj.js');
const NetworkPlayerObj = require('./NetworkPlayerObj.js');
const NetworkAsteroid = require('./NetworkAsteroid.js');
const NetworkPrj = require('./NetworkPrj.js');
const NetworkHitscan = require('./NetworkHitscan.js');
const NetworkRadial = require('./NetworkRadial.js');

class NetworkAsteroidInfo {
  constructor({ created, destroyed }) {
    this.created = created;
    this.destroyed = destroyed;
  }
}

NetworkAsteroidInfo.serializableProperties = [
  { key: 'created', type: NetworkAsteroid, isArray: true },
  { key: 'destroyed', type: 'Uint16', isArray: true },
];

class NetworkPrjInfo {
  constructor({ created, destroyed }) {
    this.created = created;
    this.destroyed = destroyed;
  }
}

NetworkPrjInfo.serializableProperties = [
  { key: 'created', type: NetworkPrj, isArray: true },
  { key: 'destroyed', type: 'Uint16', isArray: true },
];

class NetworkWorldInfo {
  constructor({ objs, asteroids, prjs, hitscans, radials, playerInfo }) {
    this.objs = objs;
    this.asteroids = asteroids;
    this.prjs = prjs;
    this.hitscans = hitscans;
    this.radials = radials;
    this.playerInfo = playerInfo;
  }
}

NetworkWorldInfo.serializableProperties = [
  { key: 'objs', type: NetworkObj, isArray: true },
  { key: 'asteroids', type: NetworkAsteroidInfo },
  { key: 'prjs', type: NetworkPrjInfo },
  { key: 'hitscans', type: NetworkHitscan, isArray: true },
  { key: 'radials', type: NetworkRadial, isArray: true },
  { key: 'playerInfo', type: NetworkPlayerObj },
];

module.exports = NetworkWorldInfo;
