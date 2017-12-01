// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

class Map {
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

  minMaxToInfo(min, max) {
    const minIndex = this.posTo2dIndex(min);
    const maxIndex = this.posTo2dIndex(max);
    return {
      len: (maxIndex[0] - minIndex[0]) + 1,
      offset: Math.ceil(this.size[0] / this.precision),
      repetitions: (maxIndex[1] - minIndex[1]) + 1,
      start: ((minIndex[1] * Math.ceil(this.size[0] / this.precision))) + minIndex[0],
    };
  }

  get length() {
    return this.posTo1dIndex(this.size);
  }
}

module.exports = Map;
