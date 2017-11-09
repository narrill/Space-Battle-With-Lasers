// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/ships.js

const missiles = {
  tomcat: {
    cullTolerance: 0.3,
    model: {
      vertices: [
        [-10, 15],
        [0, -15],
        [10, 15],
      ],
      thrusterPoints: {
        medial: {
          positive: [[0, 15]],
          negative: [[-12.5, 7]],
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

      },
    },
    destructible: {
      hp: 15,
      radius: 15,
      shield: {
        max: 0,
      },
    },
    warhead: {},
    ai: {
      aiFunction: 'basicMissile',
      detonationRadius: 100,
    },
  },
};

module.exports = missiles;
