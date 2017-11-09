// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/updaters.js

const gridFunctions = require('./gridFunctions.js');

const has = Object.prototype.hasOwnProperty;

const clearFunctions = {
  // destroys any members of the given destructible array that 
  // are outside the given grid by more than the tolerance
  cullDestructibles: (destructibles, grid) => {
    const gridDimensions = grid.gridLines * grid.gridSpacing;
    let tolerancePercent;
    for (let c = 0; c < destructibles.length; c++) {
      if (has.call(destructibles[c], 'cullTolerance')) {
        tolerancePercent = destructibles[c].cullTolerance;
        const tolerances = [gridDimensions * tolerancePercent, gridDimensions * tolerancePercent];
        const position = [destructibles[c].x, destructibles[c].y];
        if (!gridFunctions.isPositionInGrid(position, grid, tolerances)) {
          destructibles.splice(c--, 1);
        }
      }
    }
  },

  // destroys any members of the given destructible array that have zero or less hp
  clearDestructibles: (destructibles) => {
    for (let c = 0; c < destructibles.length; c++) {
      if (destructibles[c].destructible.hp <= 0) {
        if (destructibles[c].onDestroy) {
          for (let i = 0; i < destructibles[c].onDestroy.length; i++) {
            destructibles[c].onDestroy[i](destructibles[c]);
          }
        }
        destructibles.splice(c--, 1);
      }
    }
  },

  clearRadials: (radials) => {
    for (let c = 0; c < radials.length; c++) {
      if (radials[c].velocity <= 5) { radials.splice(c--, 1); }
    }
  },
};

module.exports = clearFunctions;
