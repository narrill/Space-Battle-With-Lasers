// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

let wiInterval = 0;
let lastWorldUpdate = 0;

const playerInfo = {
  x:0,
  y:0, 
  rotation:0,
  velX:0,
  velY:0,
  rotationalVelocity:0
};
const lastPlayerInfo = {
  x:0,
  y:0, 
  rotation:0,
  velX:0,
  velY:0,
  rotationalVelocity:0
};
const hudInfo = {};
let worldInfo = {
  objs:[],
  asteroids:[],
  radials:[],
  prjs:[],
  hitscans:[],
  drawing:{},
  targets:{},
  previousTargets:{}
};

const modelInfo = {};

function interpolateWiValue(obj, val){
	const now = Date.now().valueOf();
	//console.log(updateInterval);
	const perc = (now - lastWorldUpdate)/wiInterval;
	const prevObj = worldInfo.previousTargets[obj.id];
	const currentObj = worldInfo.targets[obj.id];
	obj[val] = utilities.lerp(prevObj[val], currentObj[val], utilities.clamp(0,perc,1));
	return obj[val];
}

function removeIndexFromWiCollection(index, collection){
	const obj = collection[index];
	delete worldInfo.targets[obj.id];
	delete worldInfo.previousTargets[obj.id];
	delete worldInfo.drawing[obj.id];
	collection.splice(index,1);
}

function pushCollectionFromDataToWI(dwi, type) {
	for(let c = 0;c<dwi[type].length;c++){
		const obj = dwi[type][c];
		if(worldInfo.drawing.hasOwnProperty(obj.id)) {
			worldInfo.targets[obj.id] = obj;
			worldInfo.drawing[obj.id] = true;
		}
		else {
			worldInfo.previousTargets[obj.id] = utilities.deepObjectMerge.call({}, obj);
			worldInfo[type].push(obj);
			worldInfo.drawing[obj.id] = false;
		}
	}
}

function resetWi(){
	worldInfo.objs = [];
	worldInfo.asteroids = [];
	worldInfo.radials = [];
	worldInfo.prjs = [];
	worldInfo.hitscans = [];
	worldInfo.drawing = {};
	worldInfo.targets = {};
	worldInfo.previousTargets = {};
}

function addShips(ships) {
	Object.keys(ships).forEach((id) => {
		modelInfo[id] = ships[id];
	});
}

function addShip(shipInfo) {
	modelInfo[shipInfo.id] = shipInfo.model;
}

module.exports = {
	playerInfo,
	lastPlayerInfo,
	hudInfo,
	worldInfo,
	modelInfo,
	addShips,
	addShip,
	interpolateWiValue,
	removeIndexFromWiCollection,
	pushCollectionFromDataToWI,
	resetWi,
	setWiInterval: (wii) => {
		wiInterval = wii;
	},
	setLastWorldUpdate: (lwu) => {
		lastWorldUpdate = lwu;
	}
};