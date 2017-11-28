(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');
const drawing = require('./drawing.js');

const GAME_STATES = {
  TITLE:0,
  PLAYING:1,
  DISCONNECTED:2,
  CHOOSESHIP:3,
  WAIT:4
};

class Viewport {
  constructor(objectParams = {}) {
    this.startX = (objectParams.startX) ? objectParams.startX : 0;
    this.startY = (objectParams.startY) ? objectParams.startY : 0;
    this.endX = (objectParams.endX) ? objectParams.endX : 1;
    this.endY = (objectParams.endY) ? objectParams.endY : 1;
    this.parent = objectParams.parent;
  }
}

class Camera {
  constructor(canvas, objectParams = {}) {
    this.x = (objectParams.x) ? objectParams.x : 0;
    this.y = (objectParams.y) ? objectParams.y : 0;
    this.rotation = (objectParams.rotation) ? objectParams.rotation : 0;
    this.zoom =  (objectParams.zoom) ? objectParams.zoom : 1;
    this.minZoom = (objectParams.minZoom)?objectParams.minZoom:.1;
    this.maxZoom = (objectParams.maxZoom)?objectParams.maxZoom:Number.MAX_VALUE;
    this.viewport = new Viewport(objectParams.viewport);
    
    this.ctx = canvas.getContext('2d');
  }
  get width(){
    return canvas.width;
  }
  get height(){
    return canvas.height;
  }

  worldPointToCameraSpace (xw, yw, zw = 0) {
    const zoom = 1/(1/this.zoom + zw);
    var cameraToPointVector = [(xw - this.x) * zoom, (yw - this.y) * zoom];
    var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
    return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
  }
}

class Oscillator {
  constructor(periodSeconds) {
    this.start = Date.now() / 1000;
    this._period = periodSeconds;
  }
  getValue(t) {
    return Math.sin((2*Math.PI*(t+this.start))/this.period);
  }
  restart(t) {
    this.start = t;
  }
  get period() {
    return this._period;
  }
}

class LooseTimer {
  constructor(intervalMS, func) {
    this.interval = intervalMS;
    this.lastTick = 0;
    this.func = func;
  }
  check(now = Date.now().valueOf()) {
    const diffTicks = (now - this.lastTick) / this.interval;
    if(diffTicks >= 1) {
      this.lastTick += this.interval * Math.floor(diffTicks);
      this.func();
    }
  }
}

let titleMusic;
let gameplayMusic;
let lastTime = 0;
let accumulator = 0;
let socket;
let canvas;
let context;
let inputBox;
let entry;
let startTime = 0;
let camera;
let minimapCamera;
let state;
let shipList = [];
const titleOsc = new Oscillator(6);
const titleCameraOsc = new Oscillator(60);
const worldInfo = require('./worldInfo.js').worldInfo;
const modelInfo = require('./worldInfo.js').modelInfo;

const stars = { // Container for the starfield background objects. Populated at run-time
  objs:[], // From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/main.js
  colors:[
    'white',
    'yellow'
  ]
};
// Rendering information for the grid graphic
let grid = { // From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/main.js
  gridLines: 500, //number of grid lines
  gridSpacing: 20, //pixels per grid unit
  gridStart: [-5000, -5000], //corner anchor in world coordinates
  colors:[
    {
      color: '#1111FF',
      interval: 1000
    },
    {
      color: 'blue',
      interval: 200
    },
    {
      color: 'mediumblue',
      interval: 50,
      minimap: true
    },
    {
      color: 'darkblue',
      interval: 10
    },
    {
      color: 'navyblue',
      interval: 2
    }
  ]
};

// Populates the starfield background container
// From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/constructors.js
const generateStarField = (stars) => {
  const lower = -10000000;
  const upper = 10000000;
  const maxRadius = 8000;
  const minRadius = 2000;
  const minZ = 4000;
  const maxZ = 7000;
  for(let c = 0; c < 500; c++){
    const group = Math.floor(Math.random() * stars.colors.length);
    stars.objs.push({
      x: Math.random() * (upper - lower) + lower,
      y: Math.random() * (upper - lower) + lower,
      z: Math.random() * (maxZ - minZ) + minZ,
      radius: Math.random() * (maxRadius - minRadius) + minRadius,
      colorIndex: group
    });
  }
};

let report = false;
const keys = require('../server/keys.js');
const myKeys = keys.myKeys;
myKeys.keydown = [];
const myMouse = keys.myMouse;
myMouse.mousedown = [];
myMouse.direction = 0;
myMouse.wheel = 0;
myMouse.sensitivity = 0.04;

let locked = false;
const pointerInit = (c) => {
  canvas = c;
  canvas.addEventListener("mouseup",requestLock);
  // Hook pointer lock state change events
  document.addEventListener('pointerlockchange', changeCallback, false);
  document.addEventListener('mozpointerlockchange', changeCallback, false);
  document.addEventListener('webkitpointerlockchange', changeCallback, false);
  canvas.requestPointerLock = canvas.requestPointerLock ||
    canvas.mozRequestPointerLock ||
    canvas.webkitRequestPointerLock;
  canvas.onselectstart = function(){ return false; };
}

window.addEventListener("keydown",function(e){
  if(state==GAME_STATES.CHOOSESHIP){
    if(e.keyCode == 8 && entry.length>0)
      entry = entry.slice(0,-1);
    else if(e.keyCode!=13) entry+=String.fromCharCode(e.keyCode);
  }
  else if(state === GAME_STATES.PLAYING) {
    socket.emit('input', {keyCode:e.keyCode,pos:1});
    if(e.key === 'r')
      report = true;
  }
  myKeys.keydown[e.keyCode] = true;
  e.preventDefault();
  e.stopPropagation();
});
  
window.addEventListener("keyup",function(e){
  myKeys.keydown[e.keyCode] = false;
  if(state === GAME_STATES.PLAYING)
    socket.emit('input', {keyCode:e.keyCode, pos:0});
  e.preventDefault();
  e.stopPropagation();
});

const requestLock = () => {
  canvas.requestPointerLock();
}

const mouseDown = (e) => {
  myMouse[e.button] = true;
  e.preventDefault();
  e.stopPropagation();
}

const mouseUp = (e) => {
  myMouse[e.button] = false;
  e.preventDefault();
  e.stopPropagation();
}

const mouseWheel = (e) => {
  myMouse.wheel += e.wheelDelta;
  e.preventDefault();
  e.stopPropagation();
}

const changeCallback = () => {
  if (document.pointerLockElement === canvas ||
    document.mozPointerLockElement === canvas ||
    document.webkitPointerLockElement === canvas) {
    // Pointer was just locked
    // Enable the mousemove listener
    window.removeEventListener("mouseup",requestLock,false);
    window.addEventListener("mousedown",mouseDown,false);
    window.addEventListener("mouseup",mouseUp,false);
    window.addEventListener("mousewheel",mouseWheel,false);
    canvas.addEventListener("mousemove", moveCallback, false);
    canvas.addEventListener("drag", () => {}, false);
    canvas.onclick = undefined;
    locked = true;
  } else {
    // Pointer was just unlocked
    // Disable the mousemove listener
    window.removeEventListener("mousedown",mouseDown,false);
    window.removeEventListener("mouseup",mouseUp,false);
    window.removeEventListener("mousewheel",mouseWheel,false);
    document.addEventListener("mouseup",requestLock,false);
    canvas.removeEventListener("mousemove", moveCallback, false);
    canvas.removeEventListener("drag", () => {}, false);
    canvas.onclick = function(){
      canvas.requestPointerLock();
    };
    locked = false;
  }
}
const moveCallback = (e) => {
  var movementX = e.movementX;
  var movementY = e.movementY;
  myMouse.direction += movementX;
}
const resetMouse = () => {
  myMouse.wheel = 0;
  myMouse.direction = 0;
}
const resetWheel = () => {
  myMouse.wheel = 0;
}

const resetDirection = () => {
  myMouse.direction = 0;
}

let lastMouseDirection = 0;
const mouseTimer = new LooseTimer(50, () => {
  if(myMouse.direction !== lastMouseDirection) {
    lastMouseDirection = myMouse.direction;
    console.log(`mouse report ${myMouse.direction}`);
    socket.emit('input', {md: myMouse.direction});
    resetDirection();
  }
});

// Moves the dependent camera to the location and orientation of the main 
// camera, but with the given Z-offset to simulate depth
const linkCameraWithOffset = (mainCamera, dependentCamera, offset) => {
  dependentCamera.x = mainCamera.x;
  dependentCamera.y = mainCamera.y;
  dependentCamera.rotation = mainCamera.rotation;
  const cameraDistance = 1/mainCamera.zoom;
  dependentCamera.zoom = 1/(cameraDistance+offset);
};

const update = (dt) => {
  if((state == GAME_STATES.TITLE || state == GAME_STATES.DISCONNECTED) && myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER])
  {
    state = GAME_STATES.CHOOSESHIP;
    myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
    entry = "";
    //socket.send({requestShipList:true});
    //game.resetGame();
  }
  else if(state === GAME_STATES.DISCONNECTED) {
    gameplayMusic.pause();
    gameplayMusic.currentTime = 0;
  }
  else if(state == GAME_STATES.CHOOSESHIP && myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER])
  {
    state = GAME_STATES.WAIT;
    myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
    socket.emit('ship', entry);
  }
  else if (state === GAME_STATES.CHOOSESHIP) {    
    titleMusic.volume = utilities.clamp(0, titleMusic.volume - .2 * dt, 1);
  }
  else if(state == GAME_STATES.PLAYING)
  {
    titleMusic.volume = utilities.clamp(0, titleMusic.volume - dt, 1);
    gameplayMusic.play();
  //camera shenanigans
  //camera zoom controls
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && camera.zoom<=camera.maxZoom)
      camera.zoom*=1+(3-1)*dt;
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] && camera.zoom>=camera.minZoom)
      camera.zoom*=1+(.33-1)*dt;
    if(myMouse.wheel)
      camera.zoom*=1+(myMouse.wheel/2000);
    if(camera.zoom>camera.maxZoom)
      camera.zoom = camera.maxZoom;
    else if(camera.zoom<camera.minZoom)
      camera.zoom = camera.minZoom;
    resetWheel();

    mouseTimer.check();
    if(myMouse[myMouse.BUTTONS.LEFT] != null)
    {
      socket.emit('input', {mb:myMouse.BUTTONS.LEFT,pos:myMouse[myMouse.BUTTONS.LEFT]});
      myMouse[myMouse.BUTTONS.LEFT] = undefined;
    }
    if(myMouse[myMouse.BUTTONS.RIGHT] != null)
    {
      socket.emit('input', {mb:myMouse.BUTTONS.RIGHT,pos:myMouse[myMouse.BUTTONS.RIGHT]});
      myMouse[myMouse.BUTTONS.RIGHT] = undefined;
    }
  }
}

//renders everything
const draw = (camera, minimapCamera, dt) => {    
  const now = Date.now().valueOf();
  //clear cameras
  drawing.clearCamera(camera);
  
  drawing.drawAsteroids(stars,camera);  
  
  if(state == GAME_STATES.PLAYING)
  {
    const playerInfo = worldInfo.getPlayerInfo();
    if(playerInfo && playerInfo.isDrawable) {
      camera.x = playerInfo.interpolateWiValue('x', now) + playerInfo.interpolateWiValue('velX', now)/10;
      camera.y = playerInfo.interpolateWiValue('y', now) + playerInfo.interpolateWiValue('velY', now)/10;

      let rotDiff = playerInfo.interpolateRotationValue('rotation', now) + playerInfo.interpolateWiValue('rotationalVelocity', now)/10 - camera.rotation;
      if(rotDiff > 180)
        rotDiff -= 360;
      else if(rotDiff < -180)
        rotDiff += 360;
      camera.rotation += utilities.lerp(0, rotDiff, 12 * dt);
      //camera.rotation+=rotDiff;
      if(camera.rotation > 180)
        camera.rotation -= 360;
      else if(camera.rotation < -180)
        camera.rotation += 360;
      minimapCamera.x = camera.x;
      minimapCamera.y = camera.y;
      minimapCamera.rotation = camera.rotation;
    }

    if(grid) drawing.drawGrid(camera, grid);
    drawing.drawAsteroidsOverlay(worldInfo.asteroids, camera, grid);
    for(let n = 0; n < worldInfo.objs.length; n++){
      const shipInfo = worldInfo.objs[n];
      if(shipInfo.isDrawable && shipInfo.hasModel) {
        shipInfo.model = worldInfo.getModel(shipInfo.getMostRecentValue('id'));
        drawing.drawShipOverlay(shipInfo, camera, grid, now);
      }
    }
    drawing.drawProjectiles(worldInfo.prjs, camera, dt, now);
    drawing.drawHitscans(worldInfo.hitscans, camera, now);
    for(let c = 0; c < worldInfo.objs.length; c++){
      const ship = worldInfo.objs[c];
      if(ship.isDrawable && ship.hasModel) {
        ship.model = worldInfo.getModel(ship.getMostRecentValue('id'));
        drawing.drawShip(ship, camera, now);
      }
    }
    drawing.drawRadials(worldInfo.radials, camera, dt, now);
    drawing.drawAsteroids(worldInfo.asteroids, camera);
    drawing.drawHUD(camera, now);
    drawing.drawMinimap(minimapCamera, grid, now);
    utilities.fillText(camera.ctx,'prjs: ' + worldInfo.prjs.length, 15, 30, "8pt Orbitron", 'white');

    if(Date.now().valueOf() - startTime < 15000)
      drawing.drawTutorialGraphics(camera);
  }
  else if(state == GAME_STATES.TITLE)
  {
    //drawing.drawAsteroids(game.asteroids,camera,cameras.gridCamera);
    const nowS = now / 1000;
    camera.x = titleCameraOsc.getValue(nowS) * 100000;
    camera.y = titleCameraOsc.getValue(nowS + titleCameraOsc.period/4) * 100000;
    camera.rotation = utilities.correctOrientation(camera.rotation + .1 * dt);
    drawing.drawTitleScreen(camera, titleOsc);
  } 
  else if(state == GAME_STATES.DISCONNECTED)
    drawing.drawDisconnectScreen(camera);
  else if(state == GAME_STATES.CHOOSESHIP)
    drawing.drawChooseShipScreen(camera, entry, shipList);

  if(!locked)
    drawing.drawLockedGraphic(camera);

  //resetMouse();

  utilities.fillText(camera.ctx,'fps: ' + Math.floor(1 / dt), 15, 15, "8pt Orbitron", 'white');
}

const frame = () => {
  const now = Date.now().valueOf();
  let dt = (now-lastTime)/1000;

  lastTime = Date.now().valueOf();
  draw(camera, minimapCamera, dt);

  const step = .004;
  if(dt>step*8)
  {
      dt = step;
      console.log('throttle');
  }
  accumulator+=dt;
  while(accumulator>=step){
    update(step);
    accumulator-= step;
  } 

  requestAnimationFrame(frame);
}

const init = () => {
  socket = io.connect();

  socket.on('shipList', (data) => {
    shipList = data;
  });

  socket.on('grid', (data) => {
    worldInfo.reset();
    startTime = Date.now().valueOf();
    grid = data;
    grid.z = .85;
  });

  socket.on('destroyed', () => {
    state = GAME_STATES.DISCONNECTED;
  });

  socket.on('badShipError', () => {
    if(state === GAME_STATES.WAIT) {
      entry = "";
      state = GAME_STATES.CHOOSESHIP;
    }
  });

  socket.on('worldInfo', (data) => {
    if(state === GAME_STATES.WAIT)
      state = GAME_STATES.PLAYING;
    if(report) {
      console.log(data);
      report = false;
    }
    worldInfo.pushWiData(data);
  });

  titleMusic = document.querySelector('#titleMusic');
  gameplayMusic = document.querySelector('#gameplayMusic');
  canvas = document.querySelector('#mainCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  socket.on('ship', (shipInfo) => {
    worldInfo.addShip(shipInfo);
  });

  socket.on('ships', (ships) => {
    worldInfo.addShips(ships);
  });
  context = canvas.getContext('2d');

  camera = new Camera(canvas);
  minimapCamera = new Camera(canvas, {
    zoom: .01,
    maxZoom: .01,
    minZoom: .01,
    viewport: {
      startX: .83,
      startY: .7,
      endX: 1,
      endY: 1,
      parent: camera
    }
  });

  generateStarField(stars);
  pointerInit(canvas);
  state = GAME_STATES.TITLE;
  requestAnimationFrame(frame);
};

window.onload = init;

},{"../server/keys.js":4,"../server/utilities.js":5,"./drawing.js":2,"./worldInfo.js":3}],2:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

const utilities = require('../server/utilities.js');
const worldInfo = require('./worldInfo.js').worldInfo;

const thrusterDetail = 3;
const hitscanDetail = 3;

const upVector = [0, 1];
const downVector = [0, -1];
const rightVector = [1, 0];
const leftVector = [-1, 0];

const shadeRGBColor = (color, percent) => {
    var f=color.split(","),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=parseInt(f[0].slice(4)),G=parseInt(f[1]),B=parseInt(f[2]);
    return "rgb("+(Math.round((t-R)*p)+R)+","+(Math.round((t-G)*p)+G)+","+(Math.round((t-B)*p)+B)+")";
}

const drawing = {
	//clears the given camera's canvas
	clearCamera:function(camera){
		var ctx = camera.ctx;
		ctx.fillStyle = "black"; 
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.fill();
	},	

	// Draws the grid graphic. This could use some improving, but whatever
	drawGrid (camera, grid) {
		const ctx = camera.ctx;
		const gridLines = grid.gridLines;
		const gridSpacing = grid.gridSpacing;
		const gridStart = grid.gridStart;

		for(let c = 0; c < grid.colors.length; c++){ 
			ctx.save();
			ctx.beginPath();
			for(let x = 0; x <= gridLines; x++){
				if(x % grid.colors[c].interval != 0)
					continue;
				let correctInterval = true;
				for(let n = 0; n < c; n++)
				{
					if(x % grid.colors[n].interval == 0)
					{
						correctInterval = false;
						break;
					}
				}
				if(correctInterval != true)
					continue;

				//define start and end points for current line in world space
				let start = [gridStart[0] + x * gridSpacing, gridStart[1]];
				let end = [start[0], gridStart[1] + gridLines * gridSpacing];

				//convert to camera space
				start = camera.worldPointToCameraSpace(start[0], start[1], grid.z);
				end = camera.worldPointToCameraSpace(end[0], end[1], grid.z);      
				ctx.moveTo(start[0], start[1]);
				ctx.lineTo(end[0], end[1]);
			}
			for(let y = 0; y <= gridLines; y++){
				if(y % grid.colors[c].interval != 0)
					continue;
				let correctInterval = true;
				for(let n = 0; n < c; n++)
				{
					if(y % grid.colors[n].interval == 0)
					{
						correctInterval = false;
						break;
					}
				}
				if(correctInterval!=true)
					continue;

				//same as above, but perpendicular
				let start = [gridStart[0], gridStart[0] + y * gridSpacing];
				let end = [gridStart[0] + gridLines * gridSpacing, start[1]];
				start = camera.worldPointToCameraSpace(start[0], start[1], grid.z);
				end = camera.worldPointToCameraSpace(end[0], end[1], grid.z);
				ctx.moveTo(start[0], start[1]);
				ctx.lineTo(end[0], end[1]);
			}

			//draw all lines, stroke last
			ctx.globalAlpha = .3;
			ctx.strokeWidth = 5;
			ctx.strokeStyle = grid.colors[c].color;
			ctx.stroke();
			ctx.restore();
		}
	},
	//draws the projected overlay (shields, health, laser range) for the given ship using the two given cameras (one for the gameplay plane and one for the projected plane)
	drawShipOverlay:function(ship, camera, grid, time){
		var ctx = camera.ctx;
		const gridZ = grid.z;		
		const gridZoom = 1/(gridZ + 1/camera.zoom);
		const x = ship.interpolateWiValue('x', time);
		const y = ship.interpolateWiValue('y', time);
		const rotation = ship.interpolateWiValue('rotation', time);
		const radius = ship.getMostRecentValue('radius');
		const color = ship.getMostRecentValue('color');

		var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
		var shipPosInGridCameraSpace = camera.worldPointToCameraSpace(x, y, gridZ);
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(shipPosInCameraSpace[0], shipPosInCameraSpace[1]);
		ctx.lineTo(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
		ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
		ctx.rotate((rotation - camera.rotation) * (Math.PI / 180));
		for(var type in ship.model.overlay.ranges)
		{
			ctx.arc(0, 0, ship.model.overlay.ranges[type] * gridZoom, -Math.PI / 2, Math.PI * 2 - Math.PI / 2);
		}			
		ctx.rotate(-(rotation - camera.rotation) * (Math.PI / 180));
		ctx.translate(-shipPosInGridCameraSpace[0], -shipPosInGridCameraSpace[1]);
		ctx.lineWidth = .5;
		ctx.strokeStyle = 'grey';
		ctx.globalAlpha = .2;
		ctx.stroke();

		ctx.globalAlpha = .5;
		ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
		ctx.scale(gridZoom, gridZoom);
		if(ship.model.overlay.destructible){
			ctx.beginPath();
			ctx.arc(0, 0, 150, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('shp', time)) - Math.PI / 2, true);
			ctx.strokeStyle = 'dodgerblue';
			ctx.lineWidth = 20;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(0, 0, 125, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('hp', time)) - Math.PI / 2, true);
			ctx.strokeStyle = 'green';
			ctx.stroke();
		}
		if(ship.model.overlay.colorCircle){
			ctx.beginPath();
			ctx.arc(0, 0, 75, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.fill();	
			ctx.beginPath();
			ctx.arc(0, 0, radius, 0, Math.PI * 2);
			ctx.fillStyle = 'black';
			ctx.globalAlpha = 1;
			ctx.fill();
		}
		else{
			ctx.scale(1 / gridZoom, 1 / gridZoom);
			ctx.beginPath();
			ctx.moveTo(radius * gridZoom, 0);
			ctx.arc(0, 0, radius * gridZoom, 0, Math.PI * 2);
			ctx.globalAlpha = .2;
			ctx.lineWidth = .5;
			ctx.strokeStyle = 'grey';
			ctx.stroke();
		}
		ctx.restore();
	},

	//draws the give ship's minimap representation to the given camera
	drawShipMinimap:function(ship, camera, time){
		var ctx = camera.ctx;
		ctx.save();
		const x = ship.interpolateWiValue('x', time);
		const y = ship.interpolateWiValue('y', time);
		const rotation = ship.interpolateRotationValue('rotation', time);
		const color = ship.getMostRecentValue('color');
		var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
		ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
		ctx.rotate((rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

		ctx.scale(.5,.5); //scale by zoom value

		//ctx.translate(0,7);
		ctx.beginPath();
		ctx.moveTo(ship.model.vertices[0][0],ship.model.vertices[0][1]);
		for(var c = 1;c<ship.model.vertices.length;c++)
		{
			var vert = ship.model.vertices[c];
			ctx.lineTo(vert[0],vert[1]);
		}
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.restore();
	},

	//draws the given ship in the given camera
	drawShip: function(ship, camera, time){
		const x = ship.interpolateWiValue('x', time);
		const y = ship.interpolateWiValue('y', time);
		const rotation = ship.interpolateRotationValue('rotation', time);
		const radius = ship.getMostRecentValue('radius');
		const thrusterColor = ship.getMostRecentValue('thrusterColor');
		const color = ship.getMostRecentValue('color');

		var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space

		if(shipPosInCameraSpace[0] - radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + radius * camera.zoom< 0
			|| shipPosInCameraSpace[1] - radius * camera.zoom> camera.height || shipPosInCameraSpace[1] + radius * camera.zoom< 0)
			return;

		var ctx = camera.ctx;
		ctx.save();
		ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
		ctx.rotate((rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

		ctx.scale(camera.zoom,camera.zoom); //scale by zoom value

		//Thrusters
		var width = ship.model.thrusterPoints.width;
		//forward thrust
		for(var c = 0;c<=thrusterDetail;c++){
			ctx.fillStyle = shadeRGBColor(thrusterColor,.5*c);
			ctx.save();
			ctx.beginPath();

			//Medial Thrusters
			//forward
			const medial = ship.interpolateWiValue('medial', time);
			var trailLength = 40*(medial)*(1-(c/(thrusterDetail+1)));

			if(medial>0){
				for(var n = 0; n<ship.model.thrusterPoints.medial.positive.length;n++)
				{
					var tp = ship.model.thrusterPoints.medial.positive[n];
					ctx.moveTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
					ctx.lineTo(tp[0]-rightVector[0]*width/2,tp[1]-rightVector[1]*width/2);
					ctx.lineTo(tp[0]+upVector[0]*trailLength,tp[1]+upVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
				}
			}
			//backward
			else if(medial<0){
				for(var n = 0; n<ship.model.thrusterPoints.medial.positive.length;n++)
				{
					var tp = ship.model.thrusterPoints.medial.negative[n];
					ctx.moveTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
					ctx.lineTo(tp[0]-rightVector[0]*width/2,tp[1]-rightVector[1]*width/2);
					ctx.lineTo(tp[0]+upVector[0]*trailLength,tp[1]+upVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
				}
			}	

			//rotational thrusters	
			const rotational = ship.interpolateWiValue('rotational', time);
			trailLength = 40*(rotational)*(1-(c/(thrusterDetail+1)));
			//ccw
			if(rotational>0){
				for(var n = 0; n<ship.model.thrusterPoints.rotational.positive.length;n++)
				{
					var tp = ship.model.thrusterPoints.rotational.positive[n];
					ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
					ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
					ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
				}
			}
			//cw
			else if(rotational<0){
				for(var n = 0; n<ship.model.thrusterPoints.rotational.negative.length;n++)
				{
					var tp = ship.model.thrusterPoints.rotational.negative[n];
					ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
					ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
					ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
				}
			}

			//lateral thrusters
			const lateral = ship.interpolateWiValue('lateral', time);
			trailLength = 40*(lateral)*(1-(c/(thrusterDetail+1)));
			//rightward
			if(lateral>0){
				for(var n = 0; n<ship.model.thrusterPoints.lateral.positive.length;n++)
				{
					var tp = ship.model.thrusterPoints.lateral.positive[n];
					ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
					ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
					ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
				}
			}
			//leftward
			else if(lateral<0){
				for(var n = 0; n<ship.model.thrusterPoints.lateral.negative.length;n++)
				{
					var tp = ship.model.thrusterPoints.lateral.negative[n];
					ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
					ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
					ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
					ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
				}
			}

			ctx.globalAlpha = ((c+1)/(this.thrusterDetail+1));
			ctx.fill();
			ctx.restore();
		}

		//shields
		const shp = ship.interpolateWiValue('shp', time);
		const shc = ship.interpolateWiValue('shc', time);
		if(shp>0){
			var shieldCoeff = (shc);
			ctx.save();
			ctx.fillStyle = 'dodgerblue';
			ctx.beginPath();
			for(var n = 0; n<ship.model.shieldVectors.length; n++){
				var vert = ship.model.vertices[n];
				var vec = ship.model.shieldVectors[n];
				var shieldVert = [vert[0]+vec[0]*shieldCoeff,vert[1]+vec[1]*shieldCoeff];
				if(n==0)
					ctx.moveTo(shieldVert[0],shieldVert[1]);
				else
					ctx.lineTo(shieldVert[0],shieldVert[1]);
			}
			ctx.globalAlpha = shp;
			ctx.fill();
			ctx.restore();
		}

		//the rest of the ship
		ctx.beginPath();
		ctx.moveTo(ship.model.vertices[0][0],ship.model.vertices[0][1]);
		for(var c = 1;c<ship.model.vertices.length;c++)
		{
			var vert = ship.model.vertices[c];
			ctx.lineTo(vert[0],vert[1]);
		}
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		ctx.restore();
	},

	//draws all laser objects in the given array to the given camera
	drawHitscans:function(hitscans, camera, time){
		var ctx = camera.ctx;
		for(var n = 0; n < hitscans.length; n++){
			var hitscan = hitscans[n];
			if(!hitscan.isDrawable)
				continue;
			const startX = hitscan.interpolateWiValue('startX', time);
			const startY = hitscan.interpolateWiValue('startY', time);
			const endX = hitscan.interpolateWiValue('endX', time);
			const endY = hitscan.interpolateWiValue('endY', time);
			const power = hitscan.interpolateWiValue('power', time);
			const efficiency = hitscan.interpolateWiValue('efficiency', time);
			var start = camera.worldPointToCameraSpace(startX, startY);
			var end = camera.worldPointToCameraSpace(endX, endY);
			var angle = utilities.angleBetweenVectors(end[0] - start[0], end[1] - start[1], 1, 0);
			var rightVector = utilities.rotate(0, 0, 1, 0, angle + 90);
			var width = (power && efficiency) ? (power / efficiency) * camera.zoom : 0;
			if(width < .8)
				width = .8;
			for(var c = 0; c <= hitscanDetail; c++)
			{
				var coeff = 1 - (c / (hitscanDetail + 1));
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(start[0], start[1]);
				ctx.lineTo(start[0] + coeff * width * rightVector[0] / 2, start[1] + width * rightVector[1] / 2);
				ctx.lineTo(end[0], end[1]);
				ctx.lineTo(start[0] - coeff * width * rightVector[0] / 2, start[1] - width * rightVector[1] / 2);
				ctx.arc(start[0], start[1], coeff * width / 2, -(angle - 90) * (Math.PI / 180), (angle - 90) * (Math.PI / 180) - 90, false);
				ctx.fillStyle = shadeRGBColor(hitscan.getMostRecentValue('color'), 0 + c / (hitscanDetail + 1));
				ctx.fill();
				ctx.restore();
			}
		}
	},

	//draws all projectile objects in the given array to the given camera
	drawProjectiles: function(projectiles, camera, dt, time){
		var ctx = camera.ctx;
		for(var c = 0;c< projectiles.length;c++){
			var prj = projectiles[c];
			if(!prj.isDrawable)
				continue;
			const x = prj.interpolateWiValue('x', time);
			const y = prj.interpolateWiValue('y', time);
			const velX = prj.getMostRecentValue('velocityX');
			const velY = prj.getMostRecentValue('velocityY');
			var start = camera.worldPointToCameraSpace(x, y);
			var end = camera.worldPointToCameraSpace(x + velX * dt, y + velY * dt);
			const radius = prj.getMostRecentValue('radius');

			if(start[0] > camera.width + radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius)
				continue;

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(start[0], start[1]);
			ctx.lineTo(end[0], end[1]);
			ctx.strokeStyle = prj.getMostRecentValue('color');
			var width = radius*camera.zoom;
			ctx.lineWidth = (width>1)?width:1;
			ctx.stroke();
			ctx.restore();
		}
	},

	drawRadials:function(radials, camera, dt, time){
		var ctx = camera.ctx;
		for(var c = 0;c<radials.length;c++){
			var radial = radials[c];
			if(!radial.isDrawable)
				continue;
			const x = radial.interpolateWiValue('x', time);
			const y = radial.interpolateWiValue('y', time);
			const velocity = radial.interpolateWiValue('velocity', time);
			const radius = radial.interpolateWiValue('radius', time);
			var center = camera.worldPointToCameraSpace(x, y);
			var frameVelocity = velocity * dt;

			if(center[0] > camera.width + radius + frameVelocity || center[0] < 0 - radius-frameVelocity || center[1] > camera.height + radius+frameVelocity || center[1] < 0 - radius-frameVelocity)
				return;

			ctx.save();
			ctx.beginPath();
			ctx.arc(center[0], center[1], (radius + frameVelocity / 2) * camera.zoom, 0, Math.PI * 2);
			ctx.strokeStyle = radial.getMostRecentValue('color');
			var width = frameVelocity * camera.zoom;
			ctx.lineWidth = (width > .3) ? width : .1;
			ctx.stroke();
			ctx.restore();
		};
	},

	//draws the projected overlay for all asteroids in the given array to the given main and projected cameras
	drawAsteroidsOverlay:function(asteroids, camera, grid){
		var start = [0,0];
		var end = [camera.width,camera.height];
		var ctx = camera.ctx;
		var cameraPositions = [];
		const gridZoom = 1/(grid.z + 1/camera.zoom);
		if(grid)
		{
			ctx.save();
			ctx.beginPath();
			for(var c = 0; c<asteroids.objs.length;c++)
			{
				var asteroid = asteroids.objs[c];
				var gridPosition = camera.worldPointToCameraSpace(asteroid.x,asteroid.y, grid.z);
				if(gridPosition[0] + asteroid.radius*gridZoom<start[0] || gridPosition[0] - asteroid.radius*gridZoom>end[0] || gridPosition[1] + asteroid.radius*gridZoom<start[1] || gridPosition[1] - asteroid.radius*gridZoom>end[1])
					continue;			
				cameraPositions[c] =(camera.worldPointToCameraSpace(asteroid.x,asteroid.y));
				ctx.moveTo(cameraPositions[c][0],cameraPositions[c][1]);
				ctx.lineTo(gridPosition[0],gridPosition[1]);
				ctx.moveTo(gridPosition[0],gridPosition[1]);
				//ctx.beginPath();
				ctx.arc(gridPosition[0],gridPosition[1], asteroid.radius*gridZoom,0,Math.PI*2);
			}	
			ctx.strokeStyle = 'grey';
			ctx.lineWidth = .5;
			ctx.globalAlpha = .5;
			ctx.stroke();
			ctx.restore();		
		}
	},

	//draws asteroids from the given asteroids array to the given camera
	drawAsteroids: function(asteroids, camera){
		var start = [0,0];
		var end = [camera.width,camera.height];
		var ctx = camera.ctx;
		for(var group = 0;group<asteroids.colors.length;group++){
			ctx.save()
			ctx.fillStyle = asteroids.colors[group];
			ctx.beginPath();
			for(var c = 0;c<asteroids.objs.length;c++){
				var asteroid = asteroids.objs[c];
				if(asteroid.colorIndex!=group)
					continue;

				const zoom = 1/((asteroid.z) ? asteroid.z : 0 + 1/camera.zoom);
				var finalPosition = camera.worldPointToCameraSpace(asteroid.x,asteroid.y,asteroid.z); //get asteroid's position in camera space
				
				if(finalPosition[0] + asteroid.radius*zoom<start[0] || finalPosition[0]-asteroid.radius*zoom>end[0] || finalPosition[1] + asteroid.radius*zoom<start[1] || finalPosition[1]-asteroid.radius*zoom>end[1])
						continue;
				ctx.moveTo(finalPosition[0],finalPosition[1]);
				ctx.arc(finalPosition[0],finalPosition[1],asteroid.radius*zoom,0,Math.PI*2);
			};
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		};
	},

	//draws the heads-up display to the given camera
	drawHUD: function(camera, time){
		const hudInfo = worldInfo.getPlayerInfo();
		if(!hudInfo.isDrawable)
			return;
		var ctx = camera.ctx;
		ctx.save(); // NEW
		ctx.textAlign = 'center';
		ctx.textBaseline = 'center';
		ctx.fillRect(0,camera.height,camera.width, - 30);
		utilities.fillText(ctx, ((hudInfo.current.stabilized) ? 'assisted' : 'manual'), camera.width / 2, camera.height - 10, "bold 12pt Orbitron", (hudInfo.current.stabilized) ? 'green' : 'red');
		ctx.textAlign = 'left';
		utilities.fillText(ctx, 'limiter', 10, camera.height - 10, "8pt Orbitron", 'white');
		if(hudInfo.current.clampsEnabled)
		{
			const medial = hudInfo.interpolateWiValue('clampMedial', time);
			const lateral = hudInfo.interpolateWiValue('clampLateral', time);
			const rotational = hudInfo.interpolateWiValue('clampRotational', time);
			ctx.textAlign = 'right';
			utilities.fillText(ctx, Math.round(medial), 110, camera.height - 10, "10pt Orbitron", 'green');
			utilities.fillText(ctx, Math.round(lateral), 160, camera.height - 10, "10pt Orbitron", 'cyan');
			utilities.fillText(ctx, Math.round(rotational), 195, camera.height - 10, "10pt Orbitron", 'yellow');
		}
		else
		{
			ctx.textAlign = 'left';
			utilities.fillText(ctx, 'disabled', 110, camera.height - 10, "10pt Orbitron", 'red');
		}
		
		ctx.textAlign = 'right';
		const thrusterPower = hudInfo.interpolateWiValue('thrusterPower', time);
		const weaponPower = hudInfo.interpolateWiValue('weaponPower', time);
		const shieldPower = hudInfo.interpolateWiValue('shieldPower', time);
		utilities.fillText(ctx, 'T ' + Math.round(thrusterPower * 100) + '%',camera.width - 220, camera.height - 10, "10pt Orbitron", 'green');
		utilities.fillText(ctx, ' W ' + Math.round(weaponPower * 100) + '%', camera.width - 120, camera.height - 10, "10pt Orbitron", 'red');
		utilities.fillText(ctx, ' S ' + Math.round(shieldPower * 100) + '%', camera.width - 20, camera.height - 10, "10pt Orbitron", 'dodgerblue');
		
		ctx.restore(); // NEW
	},

	//draws the minimap to the given camera
	//note that the minimap camera has a viewport
	drawMinimap:function(camera, grid, time){
		var ctx = camera.viewport.parent.ctx;
		var viewportStart = [camera.viewport.parent.width * camera.viewport.startX, camera.viewport.parent.height * camera.viewport.startY];
		var viewportEnd = [camera.viewport.parent.width * camera.viewport.endX, camera.viewport.parent.height * camera.viewport.endY];
		var viewportDimensions = [viewportEnd[0] - viewportStart[0], viewportEnd[1] - viewportStart[1]];
		ctx.save();
		ctx.translate(0, -30);
		ctx.beginPath();
		ctx.rect(viewportStart[0], viewportStart[1], viewportDimensions[0], viewportDimensions[1]);
		ctx.fillStyle = 'black';
		ctx.fill();
		ctx.clip();
		ctx.translate((viewportStart[0] + viewportDimensions[0] / 2 - camera.width / 2), (viewportStart[1] + viewportDimensions[1] / 2 - camera.height / 2));
		//ctx.translate(600,300);
		if(grid) drawing.drawGrid(camera, grid, true);
		drawing.drawAsteroids(worldInfo.asteroids, camera);
		for(var n = worldInfo.objs.length - 1; n >= 0; n--){
			var ship = worldInfo.objs[n];
			const model = worldInfo.getModel(ship.id);
			if(model && ship.isDrawable) {
				ship.model = model;
				drawing.drawShipMinimap(ship, camera, time);
			}
		}
		ctx.restore();
	},

	drawTitleScreen:function(camera, osc){
		var ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.globalAlpha = .5;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		const now = Date.now();
		const smallOffset = osc.getValue(now/1000) * 6;
		const bigOffset = osc.getValue(now/1000 - osc.period/6) * 4;
		utilities.fillText(ctx,"Space Battle With Lasers",camera.width/2,bigOffset + camera.height/5,"bold 64pt Aroma",'blue',.5);
		utilities.fillText(ctx,"SPACE BATTLE WITH LASERS",camera.width/2,smallOffset + camera.height/5,"bold 24pt Aroma",'white');
		utilities.fillText(ctx,"Press ENTER to start",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
		ctx.restore();
	},

	drawWinScreen:function(camera){
		var ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.globalAlpha = .5;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		utilities.fillText(ctx,"You win!",camera.width/2,camera.height/5,"24pt Aroma",'white');
		utilities.fillText(ctx,"Good for you. Press R to continue.",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
		ctx.restore();		
	},

	drawDisconnectScreen:function(camera){
		var ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.globalAlpha = .5;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		utilities.fillText(ctx,"Connection lost",camera.width/2,2*camera.height/5,"24pt Aroma",'white');
		utilities.fillText(ctx,"Press ENTER to send another ship",camera.width/2,3*camera.height/5,"12pt Orbitron",'white');
		ctx.restore();		
	},

	//draw pause screen in the given camera
	drawChooseShipScreen:function(camera, entry, shipList = []){
		var ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = "black",
		ctx.globalAlpha = .03;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		utilities.fillText(ctx,"Enter ship name: "+entry,camera.width/2,camera.height/2 - 30,"24pt Aroma",'white');
		var list = "Options: ";
		for(var c = 0;c<shipList.length;c++)
		{
			if(c>0)list+=', ';
			list+=shipList[c];
		}
		utilities.fillText(ctx,list,camera.width/2,camera.height/2 +30,"10pt Orbitron",'white');
		ctx.restore();
	},

	//draws the "click me" graphic
	drawLockedGraphic:function(camera){
		var ctx = camera.ctx;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		utilities.fillText(ctx,"Click me",camera.width/2,camera.height/2,"10pt Orbitron",'white');
		ctx.restore();
	},

	drawTutorialGraphics:function(camera){
		var ctx = camera.ctx;
		ctx.save();
		ctx.textAlign = 'left';
		utilities.fillText(ctx,"WASD moves your ship",camera.width/10,camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"LEFT and RIGHT arrow or mouse turns your ship",camera.width/10,2*camera.height/11,"10pt Orbitron",'white');		
		utilities.fillText(ctx,"UP and DOWN arrow or mouse-wheel zooms the camera",camera.width/10,3*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"SPACE or LEFT-CLICK fires your weapon",camera.width/10,4*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"SHIFT over-charges your thrusters",camera.width/10,5*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"ALT over-charges your shield",camera.width/10,6*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"RIGHT-CLICK over-charges your weapon",camera.width/10,7*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"C toggles the velocity limiter",camera.width/10,8*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"TAB switches between assisted and manual controls",camera.width/10,9*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"Your goal is to destroy all enemy ships",camera.width/10,10*camera.height/11,"10pt Orbitron",'white');
		//this.fill
	},
};

module.exports = drawing;
},{"../server/utilities.js":5,"./worldInfo.js":3}],3:[function(require,module,exports){
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
},{"../server/utilities.js":5}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

const utilities = {
  getForwardVector() {
    // console.log(this.rotation);
    if (!this.forwardVectorX || !this.forwardVectorY) {
      const normalizedForwardVector = utilities.rotate(0, 0, 0, -1, -this.rotation);
      this.forwardVectorX = normalizedForwardVector[0];
      this.forwardVectorY = normalizedForwardVector[1];
    }

    return [this.forwardVectorX, this.forwardVectorY];
  },

  getRightVector() {
    if (!this.rightVectorX || !this.rightVectorY) {
      const normalizedRightVector = utilities.rotate(0, 0, 0, -1, -this.rotation + 90);
      this.rightVectorX = normalizedRightVector[0];
      this.rightVectorY = normalizedRightVector[1];
    }

    return [this.rightVectorX, this.rightVectorY];
  },

  getMedialVelocity() {
    if (!this.medialVelocity) {
      const forwardVector = utilities.getForwardVector.call(this);
      this.medialVelocity = -utilities.scalarComponentOf1InDirectionOf2(
        this.velocityX,
        this.velocityY,
        forwardVector[0],
        forwardVector[1],
      ); // get magnitude of projection of velocity onto the forward vector
    }

    return this.medialVelocity;
  },

  getLateralVelocity() {
    if (!this.lateralVelocity) {
      const rightVector = utilities.getRightVector.call(this);
      this.lateralVelocity = -utilities.scalarComponentOf1InDirectionOf2(
        this.velocityX,
        this.velocityY,
        rightVector[0],
        rightVector[1],
      ); // et magnitude of velocity's projection onto the right vector
    }
    return this.lateralVelocity;
  },
  fillText: (ctx, string, x, y, css, color, alpha) => {
    ctx.save();
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    ctx.font = css;
    ctx.fillStyle = color;
    if (alpha) { ctx.globalAlpha = alpha; }
    ctx.fillText(string, x, y);
    ctx.restore();
  },
  calculateDeltaTime() {
    const now = (Date.now().valueOf()); // get date as unix timestamp
    const fps = 1000 / (now - this.lastTime);
    this.lastTime = now;
    if (isNaN(fps)) { return 0; }
    return 1 / fps;
  },
  getRandom: (min, max) => (Math.random() * (max - min)) + min,

  getRandomIntInclusive: (min, max) => Math.floor((Math.random() * ((max - min) + 1))) + min,
  circlesIntersect: (c1, c2) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    return distance < c1.radius + c2.radius;
  },
  // Function Name: getRandomColor()
  // returns a random color of alpha 1.0
  // http://paulirish.com/2009/random-hex-color-code-snippets/
  getRandomColor: () => {
    const red = Math.round((Math.random() * 200) + 55);
    const green = Math.round((Math.random() * 200) + 55);
    const blue = Math.round((Math.random() * 200) + 55);
    const color = `rgb(${red},${green},${blue})`;
    // OR if you want to change alpha
    // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
    return color;
  },
  getRandomBrightColor: () => {
    const h = Math.round(Math.random() * 360);
    const color = `hsl(${h},100%,65%)`;
    // OR if you want to change alpha
    // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
    return color;
  },

  pointInsideCircle: (x, y, I) => {
    const dx = x - I.x;
    const dy = y - I.y;
    return (dx * dx) + (dy * dy) <= I.radius * I.radius;
  },

  getRandomUnitVector: () => {
    let x = utilities.getRandom(-1, 1);
    let y = utilities.getRandom(-1, 1);
    let length = Math.sqrt((x * x) + (y * y));
    if (length === 0) { // very unlikely
      x = 1; // point right
      y = 0;
      length = 1;
    } else {
      x /= length;
      y /= length;
    }

    return { x, y };
  },

  // Translates an arbitrary orientation into the range of -180 to 180
  correctOrientation: (orientation) => {
    while (orientation > 180)
      orientation -= 360;
    while (orientation < -180)
      orientation += 360;

    return orientation;
  },

  rotationLerp: (from, to, percent) => {
    if(Math.abs(to - from) > 180) {
      const adjustment = (from > to) ? -360 : 360;
      return utilities.correctOrientation(utilities.lerp(from + adjustment, to, percent));
    }
    else
      return utilities.lerp(from, to, percent);
  },

  clamp: (min, val, max) => Math.max(min, Math.min(max, val)),

  distanceSqr: (p1, p2) => {
    const vec = [p2[0] - p1[0], p2[1] - p1[1]];
    return (vec[0] * vec[0]) + (vec[1] * vec[1]);
  },

  // http://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
  // point to rotate around, point to rotate, angle to rotate by
  rotate: (cx, cy, x, y, angle) => {
    const angleRadians = (Math.PI / 180) * angle;
    return [
      ((Math.cos(angleRadians) * (x - cx)) + (Math.sin(angleRadians) * (y - cy))) + cx,
      ((Math.cos(angleRadians) * (y - cy)) - (Math.sin(angleRadians) * (x - cx))) + cy,
    ];
  },

  dotProduct: (x1, y1, x2, y2) => (x1 * x2) + (y1 * y2),

  normalizeVector: (x, y) => {
    const magnitude = Math.sqrt((x * x) + (y * y));
    return [x / magnitude, y / magnitude];
  },

  vectorMagnitudeSqr: (x, y) => (x * x) + (y * y),

  // broken
  componentOf1InDirectionOf2: (x1, y1, x2, y2) => {
    if ((x1 === 0 && y1 === 0) || (x2 === 0 && y2 === 0)) { return [0, 0]; }
    const dot = (x1 * x2) + (y1 * y2);
    const scalar = (dot * dot) / ((x2 * x2) + (y2 * y2));
    return [scalar * x1, scalar * y1];
  },

  // projects vector 1 onto vector 2 and returns the magnitude of the projection
  scalarComponentOf1InDirectionOf2: (x1, y1, x2, y2) => {
    if ((x1 === 0 && y1 === 0) || (x2 === 0 && y2 === 0)) { return 0; }
    // var dot = x1*x2+y1*y2;
    return ((x1 * x2) + (y1 * y2)) / Math.sqrt((x2 * x2) + (y2 * y2));
  },
  // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  distanceFromPointToLine: (x, y, x1, y1, x2, y2) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = (A * C) + (B * D);
    const lenSq = (C * C) + (D * D);
    let param = -1;
    if (lenSq !== 0) { param = dot / lenSq; }

    let xx;
    let yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + (param * C);
      yy = y1 + (param * D);
    }

    const dx = x - xx;
    const dy = y - yy;
    return [Math.sqrt((dx * dx) + (dy * dy)), param];
  },

  raySphereIntersect: (s, e, c, r) => {
    const l = [c[0] - s[0], c[1] - s[1]];
    const startToEnd = [e[0] - s[0], e[1] - s[1]];
    const magnitud = Math.sqrt((startToEnd[0] * startToEnd[0]) + (startToEnd[1] * startToEnd[1]));
    const direction = [startToEnd[0] / magnitud, startToEnd[1] / magnitud];
    const tca = (l[0] * direction[0]) + (l[1] * direction[1]);
    if (tca < 0) { return false; }
    const d = Math.sqrt(((l[0] * l[0]) + (l[1] * l[1])) - (tca * tca));
    if (d < 0) { return false; }
    const thc = Math.sqrt((r * r) - (d * d));
    return tca - thc;
  },

  isCapsuleWithinCircle: (circle, capsule) => {
    let capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    if (!(capsuleAxis[0] === 0 && capsuleAxis[1] === 0)) {
      capsuleAxis = utilities.normalizeVector(capsuleAxis[0], capsuleAxis[1]);
    }

    const pushedCenter1 = [
      capsule.center1[0] - (capsuleAxis[0] * capsule.radius),
      capsule.center1[1] - (capsuleAxis[1] * capsule.radius),
    ];
    let toCircleCenter = [
      circle.center[0] - pushedCenter1[0],
      circle.center[1] - pushedCenter1[1],
    ];

    if ((toCircleCenter[0] * toCircleCenter[0]) + (toCircleCenter[1] * toCircleCenter[1])
      > (circle.radius * circle.radius)) { return false; }

    const pushedCenter2 = [
      capsule.center2[0] - (capsuleAxis[0] * capsule.radius),
      capsule.center2[1] - (capsuleAxis[1] * capsule.radius),
    ];
    toCircleCenter = [
      circle.center[0] - pushedCenter2[0],
      circle.center[1] - pushedCenter2[1],
    ];
    if ((toCircleCenter[0] * toCircleCenter[0]) + (toCircleCenter[1] * toCircleCenter[1])
      > (circle.radius * circle.radius)) { return false; }

    return true;
  },

  circleCapsuleSAT: (circle, capsule) => {
    const axisCheck = utilities.circleCapsuleAxisCheck;

    // check first capsule's center axis
    const capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    if (!axisCheck(circle, capsule, capsuleAxis)) { return false; }

    // check first capsule's normal axis
    const capsuleNormal = [-capsuleAxis[1], capsuleAxis[0]];
    if (!axisCheck(circle, capsule, capsuleNormal)) { return false; }

    const circleAxis1 = [
      capsule.center1[0] - circle.center[0],
      capsule.center1[1] - circle.center[1],
    ];
    if (!axisCheck(circle, capsule, circleAxis1)) { return false; }

    const circleAxis2 = [
      capsule.center2[0] - circle.center[0],
      capsule.center2[1] - circle.center[1],
    ];
    if (!axisCheck(circle, capsule, circleAxis2)) { return false; }

    return true;
  },

  circleCapsuleAxisCheck: (circle, capsule, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let maxCapsule;
    let minCapsule;

    const dotProductLeft = circle.center[0] * normalizedAxis[0];
    const dotProductRight = circle.center[1] * normalizedAxis[1];
    const projectedCenter = dotProductLeft + dotProductRight;
    const maxCircle = projectedCenter + circle.radius;
    const minCircle = projectedCenter - circle.radius;

    const projectedCenters = [
      (capsule.center1[0] * normalizedAxis[0]) + (capsule.center1[1] * normalizedAxis[1]),
      (capsule.center2[0] * normalizedAxis[0]) + (capsule.center2[1] * normalizedAxis[1]),
    ];
    // find min and max
    if (projectedCenters[0] > projectedCenters[1]) {
      maxCapsule = projectedCenters[0];
      minCapsule = projectedCenters[1];
    } else {
      maxCapsule = projectedCenters[1];
      minCapsule = projectedCenters[0];
    }
    // add radius, because capsule
    maxCapsule += capsule.radius;
    minCapsule -= capsule.radius;

    // return whether they overlap
    return !(maxCapsule < minCircle || maxCircle < minCapsule);
  },

  polygonCapsuleSAT: (polygon, capsule) => {
    const axisCheck = utilities.polygonCapsuleAxisCheck;

    // loop through polygon verts and do axis checks
    for (let i = 0; i < polygon.length; i++) {
      const nextPoint = (i === polygon.length - 1) ? polygon[0] : polygon[i + 1];
      // normal to axis between current point and next point
      const normalAxis = [-(nextPoint[1] - polygon[i][1]), nextPoint[0] - polygon[i][0]];
      // axis between current point and capsule center1
      const centerAxis1 = [
        capsule.center1[0] - polygon[i][0],
        capsule.center1[1] - polygon[i][1],
      ];
      // axis between current point and capsule center2
      const centerAxis2 = [
        capsule.center2[0] - polygon[i][0],
        capsule.center2[1] - polygon[i][1],
      ];
      if (!axisCheck(polygon, capsule, centerAxis1)
        || !axisCheck(polygon, capsule, centerAxis2)) {
        return false;
      } else if (normalAxis !== [0, 0] && !axisCheck(polygon, capsule, normalAxis)) {
        return false;
      }
    }

    // get axis between centers, and the normal to that axis
    const capsuleAxisNormal = [
      -(capsule.center2[1] - capsule.center1[1]),
      capsule.center2[0] - capsule.center1[0],
    ];
    const capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    // check those as well
    if (!axisCheck(polygon, capsule, capsuleAxisNormal)
      || !axisCheck(polygon, capsule, capsuleAxis)) {
      return false;
    }

    // if we made it this far there are no separating axes
    return true;
  },

  polygonCapsuleAxisCheck: (vertices, capsule, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let max1;
    let min1;
    let maxCapsule;
    let minCapsule;
    // loop through verts. project onto the axis and find the min/max
    for (let c = 0; c < vertices.length; c++) {
      const vert = vertices[c];
      const projectedVert = (vert[0] * normalizedAxis[0]) + (vert[1] * normalizedAxis[1]);
      if (c === 0 || projectedVert > max1) { max1 = projectedVert; }
      if (c === 0 || projectedVert < min1) { min1 = projectedVert; }
    }
    // project capsule centers onto the axis
    const projectedCenters = [
      (capsule.center1[0] * normalizedAxis[0]) + (capsule.center1[1] * normalizedAxis[1]),
      (capsule.center2[0] * normalizedAxis[0]) + (capsule.center2[1] * normalizedAxis[1]),
    ];
    // find min and max
    if (projectedCenters[0] > projectedCenters[1]) {
      maxCapsule = projectedCenters[0];
      minCapsule = projectedCenters[1];
    } else {
      maxCapsule = projectedCenters[1];
      minCapsule = projectedCenters[0];
    }
    // it's a capsule, so add radius
    maxCapsule += capsule.radius;
    minCapsule -= capsule.radius;

    // return bool indicating whether they overlap
    return !(max1 < minCapsule || maxCapsule < min1);
  },

  capsuleCapsuleSAT: (capsule1, capsule2) => {
    const axisCheck = utilities.capsuleCapsuleAxisCheck;

    // check first capsule's center axis
    const capsule1Axis = [
      capsule1.center2[0] - capsule1.center1[0],
      capsule1.center2[1] - capsule1.center1[1],
    ];
    if (!axisCheck(capsule1, capsule2, capsule1Axis)) { return false; }

    // check first capsule's normal axis
    const capsule1Normal = [-capsule1Axis[1], capsule1Axis[0]];
    if (!axisCheck(capsule1, capsule2, capsule1Normal)) { return false; }

    // same for second capsule
    const capsule2Axis = [
      capsule2.center2[0] - capsule2.center1[0],
      capsule2.center2[1] - capsule2.center1[1],
    ];
    if (!axisCheck(capsule1, capsule2, capsule2Axis)) { return false; }

    const capsule2Normal = [-capsule2Axis[1], capsule2Axis[0]];
    if (!axisCheck(capsule1, capsule2, capsule2Normal)) { return false; }

    return true;
  },

  capsuleCapsuleAxisCheck: (capsule1, capsule2, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let maxCapsule1;
    let minCapsule1;
    let maxCapsule2;
    let minCapsule2;

    // project capsule1's centers onto the axis
    const projectedCenters1 = [
      (capsule1.center1[0] * normalizedAxis[0]) + (capsule1.center1[1] * normalizedAxis[1]),
      (capsule1.center2[0] * normalizedAxis[0]) + (capsule1.center2[1] * normalizedAxis[1]),
    ];
    // find min and max
    if (projectedCenters1[0] > projectedCenters1[1]) {
      maxCapsule1 = projectedCenters1[0];
      minCapsule1 = projectedCenters1[1];
    } else {
      maxCapsule1 = projectedCenters1[1];
      minCapsule1 = projectedCenters1[0];
    }
    // add radius, because capsule
    maxCapsule1 += capsule1.radius;
    minCapsule1 -= capsule1.radius;

    // do the same for capsule2
    const projectedCenters2 = [
      (capsule2.center1[0] * normalizedAxis[0]) + (capsule2.center1[1] * normalizedAxis[1]),
      (capsule2.center2[0] * normalizedAxis[0]) + (capsule2.center2[1] * normalizedAxis[1]),
    ];
    if (projectedCenters2[0] > projectedCenters2[1]) {
      maxCapsule2 = projectedCenters2[0];
      minCapsule2 = projectedCenters2[1];
    } else {
      maxCapsule2 = projectedCenters2[1];
      minCapsule2 = projectedCenters2[0];
    }
    maxCapsule2 += capsule2.radius;
    minCapsule2 -= capsule2.radius;

    // return whether they overlap
    return !(maxCapsule1 < minCapsule2 || maxCapsule2 < minCapsule1);
  },

  // http://stackoverflow.com/questions/9614109/how-to-calculate-an-angle-from-points
  angle: (cx, cy, ex, ey) => {
    const dy = ey - cy;
    const dx = ex - cx;
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= (180 / Math.PI); // rads to degs, range (-180, 180]
    theta += 180;
    return theta;
  },

  // http://blog.lexique-du-net.com/index.php?post/Calculate-the-real-difference-between-two-angle
  // s-keeping-the-sign
  // Cutting the link in half because of the 100 character line limit in AirBnB's style guide. Fuc
  // k AirBnb and their stupid style guide.
  differenceBetweenAngles: (firstAngle, secondAngle) => {
    let difference = secondAngle - firstAngle;
    while (difference < -180) difference += 180;
    while (difference > 180) difference -= 180;
    return difference;
  },

  angleBetweenVectors: (x1, y1, x2, y2) => {
    let angle = (Math.atan2(y2, x2) - Math.atan2(y1, x1)) * (180 / Math.PI);

    if (angle > 180) { angle -= 360; } else if (angle < -180) { angle += 360; }
    return angle;
  },


  lerp: (from, to, percent) => (from * (1.0 - percent)) + (to * percent),

  lerp3d: (from, to, percent) => {
    const x = (from[0] * (1.0 - percent)) + (to[0] * percent);
    const y = (from[1] * (1.0 - percent)) + (to[1] * percent);
    const z = (from[2] * (1.0 - percent)) + (to[2] * percent);
    return [x, y, z];
  },

  lerpNd: (from, to, percent) => {
    const f = (!Array.isArray(from)) ? [from] : from;
    const t = (!Array.isArray(to)) ? [to] : to;
    if (f.length !== t.length) { return f; }
    const returnVal = [];

    for (let c = 0; c < f.length; c++) {
      returnVal.push((f[c] * (1.0 - percent)) + (t[c] * percent));
    }

    return returnVal;
  },

  deepObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      // if the current attribute is an object in the source
      if (src[key] instanceof Object && !(src[key] instanceof Array)) {
        // if the current attribute isn't in the this, or isn't an object in the this
        if (!this[key]
          || !(this[key] instanceof Object && !(this[key] instanceof Array))) {
          // make it an empty object
          this[key] = {};
        }
        // then deep merge the two
        if (key === 'specialProperties') {
          if (!this[key]) { this[key] = {}; }
          utilities.shallowObjectMerge.call(this[key], src[key]);
        } else { utilities.deepObjectMerge.call(this[key], src[key]); }
      } else {
        // if current attribute is an array in the source, give this a copy of it
        // this[key] = (Array.isArray(src[key])) ? src[key].slice() : src[key];

        // we'll worry about referencing bugs later
        this[key] = src[key];
      }
    });

    return this;
  },

  // deepObjectCopy(src) {
  //   const keys = Object.keys(src);
  //   const copy = {};
  //   for(let c = 0; c < keys.length; c++) {
  //     const key = keys[c];
  //   }
  // }

  veryShallowObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      if (key === 'specialProperties') {
        if (!this[key]) { this[key] = {}; }
        utilities.shallowObjectMerge.call(this[key], src[key]);
        return;
      }
      // if the current attribute is an object in the source
      if (!(src[key] instanceof Object) || (src[key] instanceof Array)) {
        this[key] = src[key];
      }
    });

    return this;
  },

  shallowObjectMerge(src) {
    if (!src) { return this; }
    Object.keys(src).forEach((key) => {
      this[key] = src[key];
    });

    return this;
  },
};

module.exports = utilities;

},{}]},{},[1]);
