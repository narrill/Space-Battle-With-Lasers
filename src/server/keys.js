// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/keys.js

const myKeys = {};

myKeys.KEYBOARD = Object.freeze({
  KEY_LEFT: 37,
  KEY_UP: 38,
  KEY_RIGHT: 39,
  KEY_DOWN: 40,
  KEY_SPACE: 32,
  KEY_SHIFT: 16,
  KEY_ALT: 18,
  KEY_W: 87,
  KEY_A: 65,
  KEY_D: 68,
  KEY_S: 83,
  KEY_Q: 81,
  KEY_E: 69,
  KEY_TAB: 9,
  KEY_F: 70,
  KEY_R: 82,
  KEY_C: 67,
  KEY_P: 80,
  KEY_CTRL: 17,
  KEY_J: 74,
  KEY_K: 75,
  KEY_L: 76,
  KEY_ENTER: 13,
});

const myMouse = {};

myMouse.BUTTONS = Object.freeze({
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
});

module.exports = { myKeys, myMouse };
