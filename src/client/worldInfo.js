// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

let wiInterval = 0;
let playerId = 0;

const hudInfo = {};

class WorldInfo {
	constructor() {
		this.reset();
	}
	reset() {
		this.objs = [];
		this.asteroids = {
			objs: [],
			colors:[]
		};
		this.radials = [];
		this.prjs = [];
		this.hitscans = [];
		this.objInfos = {};
		this.objTracker = {};
	}
	pushCollectionFromDataToWI(dwi, type) {
		const dwiCollection = dwi[type] || [];
		const now = Date.now().valueOf();
		for(let c = 0;c<dwiCollection.length;c++){
			const obj = dwiCollection[c];
			this.objTracker[obj.id] = true;
			if(this.objInfos[obj.id]) {
				this.objInfos[obj.id].pushState(obj, now);
			}
			else {
				const newObjInfo = new ObjInfo(obj, now);
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
	prep() {
		this.objTracker = {};
	}
	pushWiData(data) {
		if(data.interval) wiInterval = data.interval;
		if(data.id) playerId = data.id;
		const dwi = data.worldInfo;
		this.prep();
		this.pushCollectionFromDataToWI(dwi,'objs');
		this.pushCollectionFromDataToWI(dwi,'prjs');
		this.pushCollectionFromDataToWI(dwi,'hitscans');
		this.pushCollectionFromDataToWI(dwi,'radials');
		
		// Asteroids
		if(dwi.asteroids.colors)
			this.asteroids.colors = dwi.asteroids.colors;

		if(dwi.asteroids.objs) {
			const destroyedAsteroids = {};
			for(let c = 0; c < dwi.asteroids.objs.length; c++) {
				const a = dwi.asteroids.objs[c];
				if(a.destroyed)
					destroyedAsteroids[a.destroyed] = true;
				else
					this.asteroids.objs.push(a);
			}
			for(let c = 0; c < this.asteroids.objs.length; c++) {
				const a = this.asteroids.objs[c];
				if(destroyedAsteroids[a.id])
					this.asteroids.objs.splice(c, 1);
			}
		}
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
		return this.objInfos[playerId];
	}
	getModel(id) {
		return modelInfo[id];
	}
}

const worldInfo = new WorldInfo();

class ObjInfo {
	constructor(initialState, time) {
		this.states = [initialState];
		this.stateCount = 3;
		this.lastStateTime = time;
		this.id = initialState.id;
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