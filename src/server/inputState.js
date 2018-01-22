const STATES = {
	STARTING: 2,
	ENABLED: 1,
	DISABLED: 0
};

const isStarting = (stateVal) => {
	return stateVal === STATES.STARTING;
};

const isEnabled = (stateVal) => {
	return stateVal === STATES.ENABLED || isStarting(stateVal);
};

const isDisabled = (stateVal) => {
	return stateVal === STATES.DISABLED;
};

const advanceState = (stateVal) => {
	if(stateVal === STATES.STARTING)
		return STATES.ENABLED;
	return stateVal;
};

const advanceStateDictionary = (dictionary) => {
	const keys = Object.keys(dictionary);
	for(let c = 0; c < keys.length; c++) {
		dictionary[keys[c]] = advanceState(dictionary[keys[c]]);
	}
};

module.exports = {
	STATES,
	isStarting,
	isEnabled,
	isDisabled,
	advanceStateDictionary
};