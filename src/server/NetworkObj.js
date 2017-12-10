class NetworkObj {
  constructor(obj) {
    const dest = obj.destructible;
    const ts = obj.thrusterSystem;
    this.id = obj.id;
    this.x = obj.x;
    this.y = obj.y;
    this.rotation = obj.rotation;
    this.radius = dest.radius;
    this.shp = (dest.shield.max > 0) ? dest.shield.current / dest.shield.max : 0;
    this.shc = dest.shield.max / dest.shield.efficiency;
    this.hp = dest.hp / dest.maxHp;
    this.color = obj.color;
    this.medial = ts.medial.currentStrength / ts.medial.efficiency;
    this.lateral = ts.lateral.currentStrength / ts.lateral.efficiency;
    this.rotational = ts.rotational.currentStrength / ts.rotational.efficiency;
    this.thrusterColor = ts.color;
  }
}

module.exports = NetworkObj;