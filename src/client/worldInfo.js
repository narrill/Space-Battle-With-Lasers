// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

let wiInterval = 0;
let lastWorldUpdate = 0;
let playerId = 0;

const hudInfo = {};

class WorldInfo {
	constructor() {
		this.reset();
	}
	reset() {
		this.objs = [];
		this.asteroids = [];
		this.radials = [];
		this.prjs = [];
		this.hitscans = [];
		this.objInfos = {};
	}
	pushCollectionFromDataToWI(dwi, type) {
		const now = Date.now().valueOf();
		for(let c = 0;c<dwi[type].length;c++){
			const obj = dwi[type][c];
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
			if(!this.objInfos[obj.id])
				removeIndexFromWiCollection(c, this[type]);
		}
	}
	prep() {
		this.objInfos = {};
	}
	pushWiData(dwi) {
		this.prep();
		this.pushCollectionFromDataToWI(dwi,'objs');
	    this.pushCollectionFromDataToWI(dwi,'prjs');
	    this.pushCollectionFromDataToWI(dwi,'hitscans');
	    this.pushCollectionFromDataToWI(dwi,'radials');
	    this.asteroids = dwi.asteroids;
	}
}

const worldInfo = new WorldInfo();

class ObjInfo {
	constructor(initialState, time) {
		this.states = [initialState];
		this.stateCount = 3;
		this.lastStateTime = time;
	}
	pushState(obj, time) {
		this.lastStateTime = time;
		this.states.push(obj);
		while(states.length > this.stateCount)
			this.states.shift();
	}
	interpolateWiValue(val, time) {
		const perc = (time - this.lastStateTime) / wiInterval;
		if(perc <= 1) {
			return utilities.lerp(this.states[0][val], this.states[1][val], perc);
		}
		else {
			return utilities.lerp(this.states[1][val], this.states[2][val], utilities.clamp(0, perc - 1, 1));
		}
	}
	get isDrawable() {
		return this.states.length === this.stateCount;
	}
}

const modelInfo = {};

function interpolateFromWiInterval(from, to) {
	const now = Date.now().valueOf();
	const perc = (now - lastWorldUpdate)/wiInterval;
	return utilities.lerp(from, to, utilities.clamp(0, perc, 1));
}

function removeIndexFromWiCollection(index, collection){
	const obj = collection[index];
	delete worldInfo.objInfos[obj.id];
	collection.splice(index,1);
}

function pushCollectionFromDataToWI(dwi, type) {
	worldInfo.pushCollectionFromDataToWI(dwi, type);
}

const getPlayerInfo = () => {
	return worldInfo.objInfos[playerId];
};

function resetWi(){
	worldInfo.reset();
}

function addShips(ships) {
	Object.keys(ships).forEach((id) => {
		modelInfo[id] = ships[id];
	});
}

function addShip(shipInfo) {
	modelInfo[shipInfo.id] = shipInfo.model;
}

const pushWiData = (data) => {
	if(data.interval) wiInterval = data.interval;
    if(data.id) playerId = data.id;

    var now = Date.now().valueOf();
    lastWorldUpdate = now;
    worldInfo.pushWiData(data.worldInfo);
};

module.exports = {
	getPlayerInfo,
	worldInfo,
	modelInfo,
	addShips,
	addShip,
	interpolateFromWiInterval,
	resetWi
};