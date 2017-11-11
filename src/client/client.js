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

const clamp = (val, min, max) => {
  return Math.min(Math.max(val, min), max);
};

// Translates an arbitrary orientation into the range of -180 to 180
const correctOrientation = (orientation) => {
  while (orientation > 180)
    orientation -= 360;
  while (orientation < -180)
    orientation += 360;

  return orientation;
};

const lerp = (from, to, percent) => {
  return (from * (1.0 - percent)) + (to * percent);
};

const rotationLerp = (from, to, percent) => {
	if(Math.abs(to - from) > 180) {
		const adjustment = (from > to) ? -360 : 360;
		return correctOrientation(lerp(from + adjustment, to, percent));
	}
	else
		return lerp(from, to, percent);
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

let titleMusic;
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
const worldInfoModule = require('./worldInfo.js');
const worldInfo = worldInfoModule.worldInfo;
const playerInfo = worldInfoModule.playerInfo;
const lastPlayerInfo = worldInfoModule.lastPlayerInfo;
const hudInfo = worldInfoModule.hudInfo;
const interpolateWiValue = worldInfoModule.interpolateWiValue;
const interpolateFromWiInterval = worldInfoModule.interpolateFromWiInterval;
const pushCollectionFromDataToWI = worldInfoModule.pushCollectionFromDataToWI;
const removeIndexFromWiCollection = worldInfoModule.removeIndexFromWiCollection;
const resetWi = worldInfoModule.resetWi;

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
  else if(state === GAME_STATES.PLAYING)
    socket.emit('input', {keyCode:e.keyCode,pos:1});
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

    
    //drawing.clearCamera(cameras.starCamera);
    //game.clearCamera(cameras.minimapCamera);
    //console.log(myMouse.direction);
    socket.emit('input', {md:(myMouse.direction*myMouse.sensitivity)/dt});
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
    resetMouse();
  }
}

//renders everything
const draw = (camera, minimapCamera, dt) => {    

  //clear cameras
  drawing.clearCamera(camera);

  //camera.x = utilities.lerp(camera.x, interpolateFromWiInterval(lastPlayerInfo.x, playerInfo.x) + interpolateFromWiInterval(lastPlayerInfo.velX, playerInfo.velX)/10,12*dt);
  //camera.y = utilities.lerp(camera.y, interpolateFromWiInterval(lastPlayerInfo.y, playerInfo.y) + interpolateFromWiInterval(lastPlayerInfo.velY, playerInfo.velY)/10,12*dt);
  

  //draw grids then asteroids then ships
  //if(drawStarField)
  drawing.drawAsteroids(stars,camera);  
  
  if(state == GAME_STATES.PLAYING)
  {
    camera.x = interpolateFromWiInterval(lastPlayerInfo.x, playerInfo.x) + interpolateFromWiInterval(lastPlayerInfo.velX, playerInfo.velX)/10;
    camera.y = interpolateFromWiInterval(lastPlayerInfo.y, playerInfo.y) + interpolateFromWiInterval(lastPlayerInfo.velY, playerInfo.velY)/10;

    var rotDiff = playerInfo.rotation+playerInfo.rotationalVelocity/10 - camera.rotation;
    if(rotDiff>180)
      rotDiff-=360;
    else if(rotDiff<-180)
      rotDiff+=360;
    camera.rotation += utilities.lerp(0,rotDiff,12*dt);
    //camera.rotation+=rotDiff;
    if(camera.rotation>180)
      camera.rotation-=360;
    else if(camera.rotation<-180)
      camera.rotation+=360;
    minimapCamera.x = camera.x;
    minimapCamera.y = camera.y;
    minimapCamera.rotation = camera.rotation;

    if(grid) drawing.drawGrid(camera, grid);
    drawing.drawAsteroidsOverlay(worldInfo.asteroids,camera,grid);
    for(var n = 0;n<worldInfo.objs.length;n++){
      var ship = worldInfo.objs[n];
      if(!worldInfo.drawing[ship.id] || !worldInfoModule.modelInfo[ship.id])
        continue;
      if(!worldInfo.targets[ship.id])
      {
        //removeIndexFromWiCollection(n,worldInfo.objs);
        //n--;
        continue;
      }
      ship.model = worldInfoModule.modelInfo[ship.id];
      drawing.drawShipOverlay(ship,camera,grid);
    }
    drawing.drawProjectiles(worldInfo.prjs, camera, dt);
    drawing.drawHitscans(worldInfo.hitscans, camera);
    for(var c = 0; c<worldInfo.objs.length;c++){
      var ship = worldInfo.objs[c];
      if(!worldInfo.drawing[ship.id] || !worldInfoModule.modelInfo[ship.id])
        continue;
      if(!worldInfo.targets[ship.id])
      {
        removeIndexFromWiCollection(c,worldInfo.objs);
        c--;
        continue;
      }
      ship.model = worldInfoModule.modelInfo[ship.id];
      drawing.drawShip(ship,camera);
    }
    drawing.drawRadials(worldInfo.radials, camera, dt);
    drawing.drawAsteroids(worldInfo.asteroids,camera);
    drawing.drawHUD(camera);
    drawing.drawMinimap(minimapCamera, grid);
    utilities.fillText(camera.ctx,'prjs: '+worldInfo.prjs.length,15,30,"8pt Orbitron",'white');

    if(Date.now().valueOf() - startTime < 15000)
      drawing.drawTutorialGraphics(camera);
  }
  else if(state == GAME_STATES.TITLE)
  {
    //drawing.drawAsteroids(game.asteroids,camera,cameras.gridCamera);
    const now = Date.now()/1000;
    camera.x = titleCameraOsc.getValue(now) * 100000;
    camera.y = titleCameraOsc.getValue(now + titleCameraOsc.period/4) * 100000;
    camera.rotation = correctOrientation(camera.rotation + .1 * dt);
    drawing.drawTitleScreen(camera, titleOsc);
  } 
  else if(state == GAME_STATES.DISCONNECTED)
    drawing.drawDisconnectScreen(camera);
  else if(state == GAME_STATES.CHOOSESHIP)
    drawing.drawChooseShipScreen(camera, entry, shipList);

  if(!locked)
    drawing.drawLockedGraphic(camera);

  //resetMouse();

  utilities.fillText(camera.ctx,'fps: '+Math.floor(1/dt),15,15,"8pt Orbitron",'white');
}

const frame = () => {
  var now = Date.now().valueOf();
  var dt = (now-lastTime)/1000;

  lastTime = Date.now().valueOf();
  draw(camera, minimapCamera, dt);

  var step = .004;
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
    resetWi();
    worldInfoModule.setLastWorldUpdate(Date.now().valueOf());
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
    if(data.interval) worldInfoModule.setWiInterval(data.interval);
    lastPlayerInfo.x = playerInfo.x;
    playerInfo.x = data.x;
    lastPlayerInfo.y = playerInfo.y;
    playerInfo.y = data.y;
    lastPlayerInfo.rotation = playerInfo.rotation;
    playerInfo.rotation = data.rotation;
    lastPlayerInfo.velX = playerInfo.velX;
    playerInfo.velX = data.velX;
    lastPlayerInfo.velY = playerInfo.velY;
    playerInfo.velY = data.velY;
    lastPlayerInfo.rotationalVelocity = playerInfo.rotationalVelocity;
    playerInfo.rotationalVelocity = data.rotationalVelocity;
    lastPlayerInfo.thrusterPower = playerInfo.thrusterPower;
    playerInfo.thrusterPower = data.thrusterPower;
    lastPlayerInfo.weaponPower = playerInfo.weaponPower;
    playerInfo.weaponPower = data.weaponPower;
    lastPlayerInfo.shieldPower = playerInfo.shieldPower;
    playerInfo.shieldPower = data.shieldPower;
    hudInfo.velocityClamps = data.velocityClamps;
    hudInfo.stabilized = data.stabilized;
    hudInfo.powerDistribution = data.powerDistribution;

    for(var id in worldInfo.targets)
      worldInfo.previousTargets[id] = worldInfo.targets[id];
    worldInfo.targets = {};
    var now = Date.now().valueOf();
    worldInfoModule.setLastWorldUpdate(now);
    //console.log('last: '+lastWorldUpdate+'\nnow: '+nextWorldUpdate+'\nnext: '+nextWorldUpdate);
    pushCollectionFromDataToWI(data.worldInfo,'objs');
    pushCollectionFromDataToWI(data.worldInfo,'prjs');
    pushCollectionFromDataToWI(data.worldInfo,'hitscans');
    pushCollectionFromDataToWI(data.worldInfo,'radials');
    worldInfo.asteroids = data.worldInfo.asteroids;
  });

  titleMusic = document.querySelector('#titleMusic');
  canvas = document.querySelector('#mainCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  socket.on('ship', (shipInfo) => {
    worldInfoModule.addShip(shipInfo);
  });

  socket.on('ships', (ships) => {
    worldInfoModule.addShips(ships);
  });
  context = canvas.getContext('2d');

  inputBox = document.querySelector("#inputBox");

  inputBox = document.querySelector("#inputBox");

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
