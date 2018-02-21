const commandList = [
  'FORWARD',
  'BACKWARD',
  'LEFT',
  'RIGHT',
  'CW',
  'CCW',
  'FIRE',
  'BOOST_THRUSTER',
  'BOOST_SHIELD',
  'BOOST_WEAPON',
  'TOGGLE_STABILIZER',
  'TOGGLE_LIMITER',
];

const commands = {};

for (let c = 0; c < commandList.length; c++) {
  commands[commandList[c]] = c;
}

module.exports = commands;
