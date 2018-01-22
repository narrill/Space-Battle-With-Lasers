// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');
const drawing = require('./drawing.js');
const TrackShuffler = require('./TrackShuffler.js');
const Deserializer = require('../server/Deserializer.js');
const NetworkWorldInfo = require('../server/NetworkWorldInfo.js');

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

const playStinger = (stingerElem) => {
  stingerElem.currentTime = 0;
  stingerElem.play();
}

window.addEventListener("keydown",function(e){
  if((state === GAME_STATES.TITLE || state === GAME_STATES.CHOOSESHIP || state === GAME_STATES.DISCONNECTED) && !e.repeat)
    playStinger(keyclick);
  if(state==GAME_STATES.CHOOSESHIP){
    if(e.keyCode == 8){
      if(entry.length > 0)
        entry = entry.slice(0,-1);
    }
    else if(e.keyCode!=13)
      entry+=String.fromCharCode(e.keyCode);
  }
  else if(state === GAME_STATES.PLAYING && !e.repeat) {
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
    if(state === GAME_STATES.TITLE) playStinger(titleStinger);
    state = GAME_STATES.CHOOSESHIP;
    myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
    entry = "";
  }
  else if(state === GAME_STATES.DISCONNECTED) {
    musicShuffler.pause();
    ambientLoop.volume = 0;
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
    musicShuffler.update();
    ambientLoop.volume = utilities.clamp(0, ambientLoop.volume + dt, 1);
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
    if(myMouse[myMouse.BUTTONS.LEFT] != undefined)
    {
      socket.emit('input', {mb:myMouse.BUTTONS.LEFT,pos:myMouse[myMouse.BUTTONS.LEFT]});
      myMouse[myMouse.BUTTONS.LEFT] = undefined;
    }
    if(myMouse[myMouse.BUTTONS.RIGHT] != undefined)
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
  
  drawing.drawAsteroids(stars.objs, stars.colors, camera);  
  
  if(state == GAME_STATES.PLAYING)
  {
    const playerInfo = worldInfo.getPlayerInfo();
    if(playerInfo && playerInfo.isDrawable) {
      camera.x = playerInfo.interpolateWiValue('x', now) + playerInfo.interpolateWiValue('velocityX', now)/10;
      camera.y = playerInfo.interpolateWiValue('y', now) + playerInfo.interpolateWiValue('velocityY', now)/10;

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
    drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
    drawing.drawHUD(camera, now);
    drawing.drawMinimap(minimapCamera, grid, now);

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
    playStinger(deathStinger);
  });

  socket.on('badShipError', () => {
    if(state === GAME_STATES.WAIT) {
      entry = "";
      state = GAME_STATES.CHOOSESHIP;
    }
  });

  socket.on('worldInfoInit', (data) => {
    worldInfo.pushWiInitData(data);
  });

  socket.on('worldInfo', (data) => {
    if(state === GAME_STATES.WAIT) {
      state = GAME_STATES.PLAYING;      
      playStinger(enterGameStinger);
      if(!musicShuffler) {
        musicShuffler = new TrackShuffler([
          'gameplay1', 
          'gameplay2', 
          'gameplay3'
        ], 15);
      }
      musicShuffler.play();
    }
    if(report) {
      console.log(data);
      report = false;
    }
    const deserializer = new Deserializer(data);
    worldInfo.pushWiData(deserializer.read(NetworkWorldInfo));
  });

  titleMusic = document.querySelector('#titleMusic');
  keyclick = document.querySelector('#keyclick');
  titleStinger = document.querySelector('#titlestinger');
  enterGameStinger = document.querySelector('#entergamestinger');
  deathStinger = document.querySelector('#deathstinger');
  ambientLoop = document. querySelector('#ambientloop');
  ambientLoop.volume = 0;
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
