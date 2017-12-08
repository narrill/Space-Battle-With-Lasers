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
    warhead: {},
    thrusterSystem: {
      medial: {
        maxStrength: 2000,
      },
      lateral: {
        maxStrength: 2000,
      },
      rotational: {
        maxStrength: 400,
      },
    },
    destructible: {
      shield: {
        max: 30,
        efficiency: 4,
      },
    },
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
    warhead: {},
    launcher: {},
    targetingSystem: {},
    thrusterSystem: {},
    destructible: {},
  },
};

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
    thrusterSystem: {},
    warhead: {},
    ai: {
      aiFunction: 'basicMissile',
      detonationRadius: 100,
    },
  },
};

const populatePhysicalProperties = (ship) => {
  const model = ship.model;

  // Calculate area - https://stackoverflow.com/a/717367
  const vertsCopy = model.vertices.slice();

  // Close the polygon
  vertsCopy.push(vertsCopy[0]);
  vertsCopy.push(vertsCopy[1]);

  // Calculate the area
  let area = 0;
  for(let i = 1; i <= vertsCopy.length - 2; ++i )
    area += vertsCopy[i][0]*( vertsCopy[i+1][1] - vertsCopy[i-1][1] );
  area = Math.abs(area / 2);

  const MASS_CONVERSION_FACTOR = .02;

  // Assign physical properties
  ship.physicalProperties = {
    mass: area * MASS_CONVERSION_FACTOR,
    area: area,
  };

  console.log(ship.physicalProperties);
};

Object.values(ships).forEach(populatePhysicalProperties);
Object.values(missiles).forEach(populatePhysicalProperties);

module.exports = {ships, missiles};
