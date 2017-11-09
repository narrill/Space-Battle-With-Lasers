// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

const mapFunctions = {
  worldToGridSpace(worldPos, map) {
    return [
      (worldPos[0] - map.position[0]) / map.precision,
      (worldPos[1] - map.position[1]) / map.precision,
    ];
  },
  gridToWorldSpace(gridPos, map) {
    return [
      (gridPos[0] * map.precision) + map.position[0],
      (gridPos[1] * map.precision) + map.position[1],
    ];
  },
  posTo1dIndex(pos, map) {
    const gridSpace = mapFunctions.worldToGridSpace(pos, map, map.precision);
    const twod = [Math.floor(gridSpace[0]), Math.floor(gridSpace[1])];
    return (twod[1] * Math.ceil(map.size[0] / map.precision)) + twod[0];
  },
  posTo2dIndex(pos, map) {
    const gridSpace = mapFunctions.worldToGridSpace(pos, map, map.precision);
    return [Math.floor(gridSpace[0]), Math.floor(gridSpace[1])];
  },
  minMaxToInfo(min, max, map) {
    const minIndex = mapFunctions.posTo2dIndex(min, map, map.precision);
    const maxIndex = mapFunctions.posTo2dIndex(max, map, map.precision);
    return {
      len: (maxIndex[0] - minIndex[0]) + 1,
      offset: Math.ceil(map.size[0] / map.precision),
      repetitions: (maxIndex[1] - minIndex[1]) + 1,
      start: ((minIndex[1] * Math.ceil(map.size[0] / map.precision))) + minIndex[0],
    };
  },
};

module.exports = mapFunctions;
