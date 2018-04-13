const ships = {
  cheetah: {
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
      efficiency: 4,
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
    shield: {},
  },

  tiger: {
    cost: 0,
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

module.exports = { ships, missiles };
