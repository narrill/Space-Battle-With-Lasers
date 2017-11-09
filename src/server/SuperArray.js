class SuperArray { // (StupidArray)
  constructor() {
    this.array = [];
  }

  push(ob) {
    this.array.push(ob);
  }
  clean() {
    for (let c = this.count; c < this.array.length; c++) {
      this.array[c] = undefined;
    }
  }
  clear() {
    this.array.length = 0;
  }
  forEach(f) {
    for (let c = 0; c < this.array.length && c < this.array.length; c++) { f(this.array[c]); }
  }
  get(index) {
    return this.array[index];
  }
  set(index, val) {
    this.array[index] = val;
  }

  get count() {
    return this.array.length;
  }
}

module.exports = SuperArray;
