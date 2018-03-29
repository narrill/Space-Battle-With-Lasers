// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

const STATE_BUFFER_LENGTH = 4;
const BACKWARD_STATE_BUFFER_LENGTH = 3;

class WorldInfo {
	constructor() {
		this.reset();
	}
	reset() {
		this.objs = [];
		this.asteroids = [];
		this.asteroidColors = [];
		this.radials = [];
		this.prjs = [];
		this.hitscans = [];
		this.objInfos = {};
		this.objTracker = {};
		this.initialized = false;
		this.hasData = false;
		this.playerId = 0;
		this.wiInterval = 0;
		this.playerInfo = null;
		this.modelInfo = {};
		this.startTime = 0;
	}
	pushCollectionFromDataToWI(dwi, type, now, stateIndex) {
		const dwiCollection = dwi[type] || [];
		for(let c = 0;c<dwiCollection.length;c++){
			const obj = dwiCollection[c];
			this.objTracker[obj.id] = true;
			if(this.objInfos[obj.id]) {
				this.objInfos[obj.id].pushState(obj, stateIndex);
			}
			else {
				const newObjInfo = new ObjInfo(this, now, obj, stateIndex);
				this.objInfos[obj.id] = newObjInfo;
				this[type].push(newObjInfo);
			}
		}
		for(let c = 0; c < this[type].length; c++) {
			const obj = this[type][c];
			if(!this.objTracker[obj.id])
				this.removeIndexFromWiCollection(c, type);
		}
	}
	pushNonInterpCollectionFromDataToWI(dwi, type, now) {
		const created = dwi[type].created;
		for(let c = 0; c < created.length; c++) {
			const a = created[c];
			a.arrivalTime = now;
			this[type].push(a);
		}
		const destroyed = dwi[type].destroyed;
		for(let c = 0; c < this[type].length; c++) {
			const a = this[type][c];
			for( let i = 0; i < destroyed.length; i++) {
				if(destroyed[i] === a.id)
					this[type].splice(c--, 1);
			}
		}
	}
	prep() {
		this.objTracker = {};
	}
	pushWiInitData(data) {
		this.wiInterval = data.interval;
		this.asteroidColors = data.asteroidColors;
		this.initialized = true;
	}
	pushWiData(data) {
		const stateIndex = data.stateIndex;
		let now = Date.now().valueOf();

		if(this.startTime === 0)
			this.startTime = now;
		now = stateIndex * this.wiInterval + this.startTime;

		if(!this.playerInfo)
			this.playerInfo = new ObjInfo(this, now, data.playerInfo, stateIndex);
		else
			this.playerInfo.pushState(data.playerInfo, stateIndex);

		const dwi = data;
		this.prep();
		this.pushCollectionFromDataToWI(dwi,'objs', now, stateIndex);
		this.pushNonInterpCollectionFromDataToWI(dwi,'prjs', now);
		this.pushCollectionFromDataToWI(dwi,'hitscans', now, stateIndex);
		this.pushCollectionFromDataToWI(dwi,'radials', now, stateIndex);
		this.pushNonInterpCollectionFromDataToWI(dwi, 'asteroids', now);

		this.hasData = true;
	}
	addShips(ships) {
		Object.keys(ships).forEach((id) => {
			this.modelInfo[id] = ships[id];
		});
	}

	addShip(shipInfo) {
		this.modelInfo[shipInfo.id] = shipInfo.model;
	}
	getPlayerInfo() {
		return this.playerInfo;
	}
	getModel(id) {
		return this.modelInfo[id];
	}

	removeIndexFromWiCollection(index, type){
		const collection = this[type];
		const obj = collection[index];
		delete this.objInfos[obj.id];
		collection.splice(index,1);
	}
	get interpDelay() {
		return (STATE_BUFFER_LENGTH - 1) * this.wiInterval;
	}
}

const worldInfo = new WorldInfo();

class ObjInfo {
	constructor(worldInfo, time = Date.now(), initialState, initialStateIndex) {
		this.worldInfo = worldInfo;
		this.states = [];
		this.stateIndices = [];
		this.stateCount = STATE_BUFFER_LENGTH + BACKWARD_STATE_BUFFER_LENGTH;
		this.creationTime = time;
		this.initialStateIndex = initialStateIndex;
		this.id = initialState.id;
		if(initialState)
			this.pushState(initialState, initialStateIndex);
	}
	pushState(obj, index) {
		this.states.push(obj);
		this.stateIndices.push(index - this.initialStateIndex);
		while(this.states.length > this.stateCount) {
			this.states.shift();
			this.stateIndices.shift();
		}
	}
	interpolateWiValue(val, time) {
		return this.interpolateValue(val, time, utilities.lerp);
	}
	interpolateRotationValue(val, time) {
		return this.interpolateValue(val, time, utilities.rotationLerp);
	}
	interpolateValue(val, time, lerp) {
		const oldestStateIndex = this.stateIndices[0];
		const desiredStateIndex = (time - this.creationTime - this.worldInfo.interpDelay) / this.worldInfo.wiInterval;

		if(!this.worldInfo.wiInterval) return this.getMostRecentValue(val);
		
		const perc = desiredStateIndex - oldestStateIndex;
		if(perc < 0)
			return this.states[0][val];
		else if(perc < this.stateCount - 1) {
			return lerp(this.states[Math.floor(perc)][val], this.states[Math.ceil(perc)][val], perc - Math.floor(perc));
		}
		else {
			return this.states[this.stateCount - 1][val];
		}
	}
	getMostRecentValue(val) {
		return this.states[this.stateCount - 1][val];
	}
	get isDrawable() {
		return this.states.length === this.stateCount;
	}
	get hasModel() {
		return Boolean(this.worldInfo.getModel(this.id));
	}
	get current() {
		return this.states[this.stateCount - 1];
	}
}

module.exports = worldInfo;