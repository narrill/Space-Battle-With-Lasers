class SWBLTypedGroup {
  constructor() {
    this.obj = [];
    this.hitscan = [];
    this.prj = [];
    this.radial = [];
    this.asteroid = [];
    this.clear();
  }
  clear() {
    this.obj.length = 0;
    this.hitscan.length = 0;
    this.prj.length = 0;
    this.radial.length = 0;
    this.asteroid.length = 0;
  }
}

module.exports = SWBLTypedGroup;
