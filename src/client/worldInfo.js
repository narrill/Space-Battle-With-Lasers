// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

let wiInterval = 0;
let playerId = 0;
let playerInfo;
let initialized = false;
let hasData = false;

const hudInfo = {};

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
	}
	pushCollectionFromDataToWI(dwi, type, now) {
		const dwiCollection = dwi[type] || [];
		for(let c = 0;c<dwiCollection.length;c++){
			const obj = dwiCollection[c];
			this.objTracker[obj.id] = true;
			if(this.objInfos[obj.id]) {
				this.objInfos[obj.id].pushState(obj, now);
			}
			else {
				const newObjInfo = new ObjInfo(now, obj);
				this.objInfos[obj.id] = newObjInfo;
				this[type].push(newObjInfo);
			}
		}
		for(let c = 0; c < this[type].length; c++) {
			const obj = this[type][c];
			if(!this.objTracker[obj.id])
				removeIndexFromWiCollection(c, this[type]);
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
		wiInterval = data.interval;
		this.asteroidColors = data.asteroidColors;
		initialized = true;
	}
	pushWiData(data) {
		const now = Date.now().valueOf();
		if(!playerInfo)
			playerInfo = new ObjInfo(now, data.playerInfo);
		else
			playerInfo.pushState(data.playerInfo, now);
		const dwi = data;
		this.prep();
		this.pushCollectionFromDataToWI(dwi,'objs', now);
		this.pushNonInterpCollectionFromDataToWI(dwi,'prjs', now);
		this.pushCollectionFromDataToWI(dwi,'hitscans', now);
		this.pushCollectionFromDataToWI(dwi,'radials', now);
		this.pushNonInterpCollectionFromDataToWI(dwi, 'asteroids', now);

		hasData = true;
	}
	addShips(ships) {
		Object.keys(ships).forEach((id) => {
			modelInfo[id] = ships[id];
		});
	}

	addShip(shipInfo) {
		modelInfo[shipInfo.id] = shipInfo.model;
	}
	getPlayerInfo() {
		return playerInfo;
	}
	getModel(id) {
		return modelInfo[id];
	}
}

const worldInfo = new WorldInfo();

class ObjInfo {
	constructor(time = Date.now(), initialState) {
		this.states = [];
		this.stateCount = 3;
		this.lastStateTime = time;
		this.id = initialState.id;
		if(initialState)
			this.pushState(initialState, time)
	}
	pushState(obj, time) {
		this.lastStateTime = time;
		this.states.push(obj);
		while(this.states.length > this.stateCount)
			this.states.shift();
	}
	interpolateWiValue(val, time) {
		return this.interpolateValue(val, time, utilities.lerp);
	}
	interpolateRotationValue(val, time) {
		return this.interpolateValue(val, time, utilities.rotationLerp);
	}
	interpolateValue(val, time, lerp) {
		if(!wiInterval) return getMostRecentValue(val);
		const perc = (time - this.lastStateTime) / wiInterval;
		if(perc <= 1) {
			return lerp(this.states[0][val], this.states[1][val], perc);
		}
		else {
			return lerp(this.states[1][val], this.states[2][val], utilities.clamp(0, perc - 1, 1));
		}
	}
	getMostRecentValue(val) {
		return this.states[this.stateCount - 1][val];
	}
	get isDrawable() {
		return this.states.length === this.stateCount;
	}
	get hasModel() {
		return Boolean(modelInfo[this.id]);
	}
	get current() {
		return this.states[this.stateCount - 1];
	}
}

const modelInfo = {};

function removeIndexFromWiCollection(index, collection){
	const obj = collection[index];
	delete worldInfo.objInfos[obj.id];
	collection.splice(index,1);
}

module.exports = {
	worldInfo,
	modelInfo
};