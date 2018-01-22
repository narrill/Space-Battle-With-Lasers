const commands = require('../server/commands.js');
const keys = require('../server/keys.js');

const keymap = {
	KeyW: commands.FORWARD,
	KeyS: commands.BACKWARD,
	KeyA: commands.LEFT,
	KeyD: commands.RIGHT,
	ArrowRight: commands.CW,
	ArrowLeft: commands.CCW,
	ShiftLeft: commands.BOOST_THRUSTER,
	AltLeft: commands.BOOST_SHIELD,
	0: commands.FIRE,
	2: commands.BOOST_WEAPON,
	Tab: commands.TOGGLE_STABILIZER,
	KeyC: commands.TOGGLE_LIMITER
};

module.exports = keymap;