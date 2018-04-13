const utilities = require('./utilities.js');
const Obj = require('./Obj.js');

const has = Object.prototype.hasOwnProperty;

const ships = {
  cheetah: {
    buyCost: 0,
    model: {
      vertices: [
        [-20, 17],
        [0, 7],
        [20, 17],
        [0, -23],
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
      weaponOffset: [0, -30],
      overlay: {
        colorCircle: {},
        destructible: {},
        ranges: {
          laser: {},
        },
      },
    },
    laser: { range: 2000 },
    stabilizer: {},
    powerSystem: {},
    thrusterSystem: {
      medial: {
        maxStrength: 70000,
        powerRampLimit: 60000,
      },
      lateral: {
        maxStrength: 70000,
        powerRampLimit: 60000,
      },
      rotational: {
        maxStrength: 70000,
        powerRampLimit: 60000,
      },
    },
    shield: {
      max: 30,
      recharge: 3,
      efficiency: 4,
    },
  },

  gull: {
    buyCost: 0,
    model: {
      vertices: [
        [-10, -5],
        [0, 20],
        [10, -5],
        [0, -20],
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

      weaponOffset: [0, -30],

      overlay: {
        colorCircle: true,
        destructible: true,
      },
    },
    cannon: {},
    stabilizer: {},
    powerSystem: {},
    thrusterSystem: {
      medial: {
        maxStrength: 60000,
        powerRampLimit: 45000,
      },
      lateral: {
        maxStrength: 60000,
        powerRampLimit: 45000,
      },
      rotational: {
        maxStrength: 60000,
        powerRampLimit: 45000,
      },
    },
    shield: {
      max: 100,
      recharge: 3,
      efficiency: 8,
    },
  },

  tiger: {
    model: {
      vertices: [
        [10, -17],
        [0, -7],
        [-10, -17],
        [-35, 35],
        [0, 15],
        [35, 35],
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

      weaponOffset: [0, -30],

      overlay: {
        colorCircle: true,
        destructible: true,
      },
    },
    cannon: {
      ammo: {
        decayTimeSeconds: 0.25,
      },
      cd: 0.03,
      spread: 20,
      multiShot: 6,
    },
    stabilizer: {},
    powerSystem: {},
    thrusterSystem: {
      medial: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
      lateral: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
      rotational: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
    },
    shield: {
      max: 200,
      recharge: 3,
      efficiency: 8,
    },
  },

  orca: {
    model: {
      vertices: [
        [-20, 17],
        [0, 7],
        [20, 17],
        [20, -5],
        [0, -23],
        [-20, -5],
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

      weaponOffset: [0, -30],

      overlay: {
        colorCircle: true,
        destructible: true,
      },
    },
    launcher: {

    },
    stabilizer: {},
    powerSystem: {},
    thrusterSystem: {
      medial: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
      lateral: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
      rotational: {
        maxStrength: 100000,
        powerRampLimit: 45000,
      },
    },
    shield: {
      max: 200,
      recharge: 3,
      efficiency: 8,
    },
  },
};

const missiles = {
  tomcat: {
    cullTolerance: 0.3,
    model: {
      vertices: [
        [-5, 15],
        [0, -15],
        [5, 15],
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
    thrusterSystem: {
      medial: {
        maxStrength: 28000,
        powerRampLimit: 14000,
      },
    },
    warhead: {
      radial: {
        decay: 0.5,
      },
    },
    ai: {
      aiFunction: 'basicDumbFireMissile',
      detonationRadius: 500,
    },
  },
};

const populatePhysicalProperties = (bp) => {
  const ship = bp;
  const model = ship.model;

  // Calculate area - https://stackoverflow.com/a/717367
  const vertsCopy = model.vertices.slice();
  const shieldVectors = [];
  shieldVectors.length = vertsCopy.length - 1;

  // Close the polygon
  vertsCopy.push(vertsCopy[0]);
  vertsCopy.push(vertsCopy[1]);

  // Calculate stuff
  let area = 0;
  for (let i = 1; i < vertsCopy.length - 1; ++i) {
    const prev = vertsCopy[i - 1];
    const current = vertsCopy[i];
    const next = vertsCopy[i + 1];
    // Area
    area += current[0] * (next[1] - prev[1]);

    // Vert normal
    const fromPrev = utilities.normalizeVector(
      current[0] - prev[0],
      current[1] - prev[1],
    );
    const fromNext = utilities.normalizeVector(
      current[0] - next[0],
      current[1] - next[1],
    );
    const avg = [
      (fromPrev[0] + fromNext[0]) / 2,
      (fromPrev[1] + fromNext[1]) / 2,
    ];
    const prevToNext = [
      next[0] - prev[0],
      next[1] - prev[1],
    ];
    if (utilities.cross(prevToNext, avg) < 0) {
      shieldVectors[i] = [-avg[0], -avg[1]];
    } else {
      shieldVectors[i] = avg;
    }
  }
  area = Math.abs(area / 2);
  shieldVectors[0] = shieldVectors.pop(); // We need to do this because we closed the polygon
  model.shieldVectors = shieldVectors;

  const DENSITY = 0.2;
  const mass = area * DENSITY;
  const radius = Math.sqrt(area / Math.PI);

  const momentOfInertia = (mass * radius * radius) / 2;

  // Assign physical properties
  ship.physicalProperties = {
    mass,
    area,
    radius,
    momentOfInertia,
  };
  console.log(ship.physicalProperties);
};

const processShip = (bp) => {
  const bpCopy = utilities.deepObjectMerge.call({}, bp);
  populatePhysicalProperties(bpCopy);
  bpCopy.cost = Obj.getBPCost(bpCopy);
  if (!has.call(bpCopy, 'buyCost')) { bpCopy.buyCost = bpCopy.cost; }
  return Obj.completeBP(bpCopy);
};

const addShip = (ship) => {
  if (!ships[ship.name]) {
    ships[ship.name] = processShip(ship.bp);
    return true;
  }
  return false;
};

Object.keys(ships).forEach((shipName) => {
  console.log(shipName);
  ships[shipName] = processShip(ships[shipName]);
});
Object.keys(missiles).forEach((name) => {
  console.log(name);
  populatePhysicalProperties(missiles[name]);
});

module.exports = { ships, missiles, addShip, processShip };
