// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/ships.js

const ships = {
  cheetah: {
    model: {
      vertices: [
        [-20, 17],
        [0, 7],
        [20, 17],
        [0, -23],
      ],

      shieldVectors: [
        [-0.761939, 0.647648],
        [0, 0.5],
        [0.761939, 0.647648],
        [0, -1],
      ],

      thrusterPoints: {
        medial: {
          positive: [[-12.5, 12], [12.5, 12]],
          negative: [[-12.5, 7], [12.5, 7]],
        },
        lateral: {
          positive: [[10, 1.5]],
          negative: [[-10, 1.5]],
        },
        rotational: {
          positive: [[5, -8.5]],
          negative: [[-5, -8.5]],
        },
        width: 5,
      },
      overlay: {
        colorCircle: {},
        destructible: {},
        ranges: {
          laser: {},
        },
      },
    },
    laser: {},
    stabilizer: {},
    powerSystem: {},
    thrusterSystem: {
      medial: {
        maxStrength: 2000
      },
      lateral: {
        maxStrength: 2000
      },
      rotational: {
        maxStrength: 400
      }
    },
    destructible: {
      shield: {
        max: 30
      }
    }
  },

  gull: {
    model: {
      vertices: [
        [-10, -5],
        [0, 20],
        [10, -5],
        [0, -20],
      ],

      shieldVectors: [
        [-0.5, 0],
        [0, 1.25],
        [0.5, 0],
        [0, -0.75],
      ],

      thrusterPoints: {
        medial: {
          positive: [[0, 7]],
          negative: [[0, 2]],
        },
        lateral: {
          positive: [[10, -5]],
          negative: [[-10, -5]],
        },
        rotational: {
          positive: [[2, -10]],
          negative: [[-2, -10]],
        },
        width: 5,
      },

      overlay: {
        colorCircle: true,
        destructible: true,
        targetingSystem: true,
      },
    },
    cannon: {},
    stabilizer: {},
    powerSystem: {},
    launcher: {},
    targetingSystem: {},
  },
};

module.exports = ships;
