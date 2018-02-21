const STATES = {
  STARTING: 2,
  ENABLED: 1,
  DISABLED: 0,
};

const isStarting = stateVal => stateVal === STATES.STARTING;

const isEnabled = stateVal => stateVal === STATES.ENABLED || isStarting(stateVal);

const isDisabled = stateVal => stateVal === STATES.DISABLED;

const advanceState = (stateVal) => {
  if (stateVal === STATES.STARTING) { return STATES.ENABLED; }
  return stateVal;
};

const advanceStateDictionary = function asd() {
  const keys = Object.keys(this);
  for (let c = 0; c < keys.length; c++) {
    this[keys[c]] = advanceState(this[keys[c]]);
  }
};

module.exports = {
  STATES,
  isStarting,
  isEnabled,
  isDisabled,
  advanceStateDictionary,
};
