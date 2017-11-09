// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

const gridFunctions = {
  // returns a random position within the given grid
  randomGridPosition: (grid) => {
    const lower = [grid.gridStart[0], grid.gridStart[1]];
    const upper = [
      lower[0] + (grid.gridLines * grid.gridSpacing),
      lower[1] + (grid.gridLines * grid.gridSpacing),
    ];
    return {
      // position/rotation
      x: (Math.random() * (upper[0] - lower[0])) + lower[0],
      y: (Math.random() * (upper[1] - lower[1])) + lower[1],
    };
  },

  // returns a bool indicating whether the given position is 
  // within the given grid plus tolerances (in pixels)
  isPositionInGrid: (position, grid, tolerances = [0, 0]) => {
    const lower = [grid.gridStart[0], grid.gridStart[1]];
    const upper = [
      lower[0] + (grid.gridLines * grid.gridSpacing),
      lower[1] + (grid.gridLines * grid.gridSpacing),
    ];

    return position[0] > lower[0] - tolerances[0]
      && position[0] < upper[0] + tolerances[0]
      && position[1] > lower[1] - tolerances[1]
      && position[1] < upper[1] + tolerances[1];
  },
};

module.exports = gridFunctions;
