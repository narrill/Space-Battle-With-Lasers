// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

class MinMaxInfo {
  constructor(map, min, max) {
    const minIndex = map.posTo2dIndex(min);
    const maxIndex = map.posTo2dIndex(max);
    const mmWidth = maxIndex[0] - minIndex[0];
    const mmHeight = maxIndex[1] - minIndex[1];
    const mapWidth = Math.ceil(Math.ceil(map.size[0] / map.precision));
    const mmiWidth = Math.max(mmWidth, mapWidth);
    
    this.len = mmWidth + 1;
    this.offset = mmiWidth;
    this.repetitions = mmHeight + 1;
    this.start = (minIndex[1] * mmiWidth) + minIndex[0];
  }

  iterateUnbounded(f) {
    for (let row = 0; row < this.repetitions; row++) {
      for (let col = 0; col < this.len; col++) {
        const tileIndex = this.start + col + (this.offset * row);
        f(tileIndex);
      }
    }
  }
}

class Grid {
  constructor(x = 0, y = 0, width = 0, height = 0, precision = 0) {
    this.position = [x, y];
    this.size = [width, height];
    this.precision = precision;
  }

  worldToGridSpace(worldPos) {
    return [
      (worldPos[0] - this.position[0]) / this.precision,
      (worldPos[1] - this.position[1]) / this.precision,
    ];
  }

  gridToWorldSpace(gridPos) {
    return [
      (gridPos[0] * this.precision) + this.position[0],
      (gridPos[1] * this.precision) + this.position[1],
    ];
  }

  posTo1dIndex(pos) {
    const gridSpace = this.worldToGridSpace(pos);
    const twod = [Math.floor(gridSpace[0]), Math.floor(gridSpace[1])];
    return (twod[1] * Math.ceil(this.size[0] / this.precision)) + twod[0];
  }

  posTo2dIndex(pos) {
    const gridSpace = this.worldToGridSpace(pos);
    return [Math.floor(gridSpace[0]), Math.floor(gridSpace[1])];
  }

  iterate(min2d, max2d, f) {
    const mmi = new MinMaxInfo(this, min2d, max2d);
    mmi.iterateUnbounded(f);
  }

  get length() {
    return this.posTo1dIndex([this.position[0] + this.size[0], this.position[1] + this.size[1]]) + 1;
  }
}

module.exports = Grid;
