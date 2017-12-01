class ReportQueue {
  constructor() {
    this._objects = [];
    this.clear();
  }
  clear() {
    this._objects.length = 0;
    this.min = [Number.MAX_VALUE, Number.MAX_VALUE];
      this.max = [-Number.MAX_VALUE, -Number.MAX_VALUE];
  }
  push(object) {
    if (object.x < this.min[0]) { this.min[0] = object.x; }
    if (object.y < this.min[1]) { this.min[1] = object.y; }
    if (object.x > this.max[0]) { this.max[0] = object.x; }
    if (object.y > this.max[1]) { this.max[1] = object.y; }
    this._objects.push(object);
  }
  get objects() {
    return this._objects;
  }

  get count() {
    return this._objects.length;
  }
}

module.exports = ReportQueue;