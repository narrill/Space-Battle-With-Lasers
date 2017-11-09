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
    this.minZoom = (objectParams.minZoom)?objectParams.minZoom:0;
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

  worldPointToCameraSpace (xw, yw) {
    var cameraToPointVector = [(xw - this.x) * this.zoom, (yw - this.y) * this.zoom];
    var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
    return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
  }
}

let lastTime = 0;
let accumulator = 0;
let socket;
let canvas;
let context;
let inputBox;
let entry;
const cameras = {};
let state;
let shipList = [];
const worldInfoModule = require('./worldInfo.js');
const worldInfo = worldInfoModule.worldInfo;
const playerInfo = worldInfoModule.playerInfo;
const lastPlayerInfo = worldInfoModule.lastPlayerInfo;
const hudInfo = worldInfoModule.hudInfo;
const interpolateWiValue = worldInfoModule.interpolateWiValue;
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
  for(let c = 0; c < 500; c++){
    const group = Math.floor(Math.random() * stars.colors.length);
    stars.objs.push({
      x: Math.random() * (upper - lower) + lower,
      y: Math.random() * (upper - lower) + lower,
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
  else if(state == GAME_STATES.PLAYING)
  {
  //camera shenanigans
  //camera zoom controls
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && cameras.camera.zoom<=cameras.camera.maxZoom)
      cameras.camera.zoom*=1+(3-1)*dt;
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] && cameras.camera.zoom>=cameras.camera.minZoom)
      cameras.camera.zoom*=1+(.33-1)*dt;
    if(myMouse.wheel)
      cameras.camera.zoom*=1+(myMouse.wheel/500);
    if(cameras.camera.zoom>cameras.camera.maxZoom)
      cameras.camera.zoom = cameras.camera.maxZoom;
    else if(cameras.camera.zoom<cameras.camera.minZoom)
      cameras.camera.zoom = cameras.camera.minZoom;

    
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
const draw = (cameras,  dt) => {    

  //clear cameras
  drawing.clearCamera(cameras.camera);

  cameras.camera.x = utilities.lerp(cameras.camera.x,playerInfo.x+playerInfo.velX/10,12*dt);
  cameras.camera.y = utilities.lerp(cameras.camera.y,playerInfo.y+playerInfo.velY/10,12*dt);

  var rotDiff = playerInfo.rotation+playerInfo.rotationalVelocity/10 - cameras.camera.rotation;
  if(rotDiff>180)
    rotDiff-=360;
  else if(rotDiff<-180)
    rotDiff+=360;
  cameras.camera.rotation += utilities.lerp(0,rotDiff,12*dt);
  //cameras.camera.rotation+=rotDiff;
  if(cameras.camera.rotation>180)
    cameras.camera.rotation-=360;
  else if(cameras.camera.rotation<-180)
    cameras.camera.rotation+=360;
  cameras.starCamera.x = cameras.camera.x;
  cameras.starCamera.y = cameras.camera.y;
  cameras.starCamera.rotation = cameras.camera.rotation;
  cameras.gridCamera.x = cameras.camera.x;
  cameras.gridCamera.y = cameras.camera.y;
  cameras.gridCamera.rotation = cameras.camera.rotation;
  var cameraDistance = 1/cameras.camera.zoom;
  cameras.starCamera.zoom = 1/(cameraDistance+10000);
  cameras.gridCamera.zoom = 1/(cameraDistance+5);
  cameras.minimapCamera.x = cameras.camera.x;
  cameras.minimapCamera.y = cameras.camera.y;
  cameras.minimapCamera.rotation = cameras.camera.rotation;

  //draw grids then asteroids then ships
  //if(drawStarField)
    drawing.drawAsteroids(stars,cameras.starCamera);    
  
  if(state == GAME_STATES.PLAYING)
  {
    if(grid) drawing.drawGrid(cameras.gridCamera, grid);
    drawing.drawAsteroidsOverlay(worldInfo.asteroids,cameras.camera,cameras.gridCamera);
    for(var n = 0;n<worldInfo.objs.length;n++){
      var ship = worldInfo.objs[n];
      if(!worldInfo.drawing[ship.id])
        continue;
      if(!worldInfo.targets[ship.id])
      {
        //removeIndexFromWiCollection(n,worldInfo.objs);
        //n--;
        continue;
      }
      drawing.drawShipOverlay(ship,cameras.camera,cameras.gridCamera);
    }
    drawing.drawProjectiles(worldInfo.prjs, cameras.camera, dt);
    drawing.drawHitscans(worldInfo.hitscans, cameras.camera);
    for(var c = 0; c<worldInfo.objs.length;c++){
      var ship = worldInfo.objs[c];
      if(!worldInfo.drawing[ship.id])
        continue;
      if(!worldInfo.targets[ship.id])
      {
        removeIndexFromWiCollection(c,worldInfo.objs);
        c--;
        continue;
      }
      drawing.drawShip(ship,cameras.camera);
    }
    drawing.drawRadials(worldInfo.radials, cameras.camera, dt);
    drawing.drawAsteroids(worldInfo.asteroids,cameras.camera, cameras.gridCamera);
    drawing.drawHUD(cameras.camera);
    drawing.drawMinimap(cameras.minimapCamera, grid);
    utilities.fillText(cameras.camera.ctx,'prjs: '+worldInfo.prjs.length,15,30,"8pt Orbitron",'white');
  }
  else if(state == GAME_STATES.TITLE)
  {
    //drawing.drawAsteroids(game.asteroids,cameras.camera,cameras.gridCamera);
    drawing.drawTitleScreen(cameras.camera);
  } 
  else if(state == GAME_STATES.DISCONNECTED)
    drawing.drawDisconnectScreen(cameras.camera);
  else if(state == GAME_STATES.CHOOSESHIP)
    drawing.drawChooseShipScreen(cameras.camera, entry, shipList);

  if(!locked)
    drawing.drawLockedGraphic(cameras.camera);

  //resetMouse();

  utilities.fillText(cameras.camera.ctx,'fps: '+Math.floor(1/dt),15,15,"8pt Orbitron",'white');
}

const frame = () => {
  var now = Date.now().valueOf();
  var dt = (now-lastTime)/1000;

  lastTime = Date.now().valueOf();
  draw(cameras,dt);

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

  socket.on('destroyed', () => {
    state = GAME_STATES.DISCONNECTED;
  });

  socket.on('grid', (data) => {
    resetWi();
    worldInfoModule.setLastWorldUpdate(Date.now().valueOf());
    grid = data;
  });

  socket.on('destroyed', () => {
    state = GAME_STATES.DISCONNECTED;
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

  canvas = document.querySelector('#mainCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  context = canvas.getContext('2d');

  inputBox = document.querySelector("#inputBox");

  inputBox = document.querySelector("#inputBox");

  cameras.camera = new Camera(canvas);
  cameras.starCamera = new Camera(canvas);
  cameras.gridCamera = new Camera(canvas);
  cameras.minimapCamera = new Camera(canvas, {
    zoom: .001,
    viewport: {
      startX: .83,
      startY: .7,
      endX: 1,
      endY: 1,
      parent: cameras.camera
    }
  });

  generateStarField(stars);
  pointerInit(canvas);
  state = GAME_STATES.TITLE;
  requestAnimationFrame(frame);
};

window.onload = init;
