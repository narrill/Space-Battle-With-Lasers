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

module.exports = NetworkHitscan;