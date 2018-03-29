(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const utilities = require('../server/utilities.js');
const Viewport = require('./Viewport.js');

class Camera {
  constructor(canvas, objectParams = {}) {
    this.x = (objectParams.x) ? objectParams.x : 0;
    this.y = (objectParams.y) ? objectParams.y : 0;
    this.rotation = (objectParams.rotation) ? objectParams.rotation : 0;
    this.zoom =  (objectParams.zoom) ? objectParams.zoom : 1;
    this.minZoom = (objectParams.minZoom)?objectParams.minZoom:.1;
    this.maxZoom = (objectParams.maxZoom)?objectParams.maxZoom:Number.MAX_VALUE;
    this.viewport = new Viewport(objectParams.viewport);
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  get width(){
    return this.canvas.width;
  }

  get height(){
    return this.canvas.height;
  }

  worldPointToCameraSpace (xw, yw, zw = 0) {
    const zoom = 1 / (1 / this.zoom + zw);
    var cameraToPointVector = [(xw - this.x) * zoom, (yw - this.y) * zoom];
    var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
    return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
  }
}

module.exports = Camera;
},{"../server/utilities.js":37,"./Viewport.js":18}],2:[function(require,module,exports){
const EntryScreen = require('./EntryScreen.js');
const drawing = require('./drawing.js');

class ChooseShipScreen extends EntryScreen {
  constructor(client) {
    super(client, client.shipWaitScreen, 'ship');
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawEntryScreen(this.client.camera, "Enter ship name", this.entry);
    drawing.drawChooseShipScreen(this.client.camera, this.entry, this.client.shipList);
  }
}

module.exports = ChooseShipScreen;
},{"./EntryScreen.js":5,"./drawing.js":19}],3:[function(require,module,exports){
const TitleScreen = require('./TitleScreen.js');
const GameScreen = require('./GameScreen.js');
const ChooseShipScreen = require('./ChooseShipScreen.js');
const ShipWaitScreen = require('./ShipWaitScreen.js');
//const NameScreen = require('./NameScreen.js');
//const NameWaitScreen = require('./NameWaitScreen.js');
const DisconnectScreen = require('./DisconnectScreen.js');
//const BuilderScreen = require('./BuilderScreen.js');
const Camera = require('./Camera.js');
const Oscillator = require('./Oscillator.js');
const Stinger = require('./Stinger.js');
const worldInfo = require('./worldInfo.js');
const Deserializer = require('../server/Deserializer.js');
const NetworkWorldInfo = require('../server/NetworkWorldInfo.js');
const Input = require('./Input.js');
const drawing = require('./drawing.js');
const utilities = require('../server/utilities.js');

const generateStarField = (stars) => {
  const lower = -10000000;
  const upper = 10000000;
  const maxRadius = 8000;
  const minRadius = 2000;
  const minZ = 1000;
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

class Client {
  constructor() {
    this.accumulator = 0;
    this.lastTime = 0;

    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
    document.body.appendChild(this.canvas);

    this._requestLock = () => {
      this.canvas.requestPointerLock();
    };

    this._changeCallback = () => {
      if (document.pointerLockElement === this.canvas ||
        document.mozPointerLockElement === this.canvas ||
        document.webkitPointerLockElement === this.canvas) {
        // Pointer was just locked
        // Enable the mousemove listener
        window.removeEventListener("mouseup", this._requestLock, false);
        this.input.engage();
        this.canvas.addEventListener("drag", () => {}, false);
        this.canvas.onclick = undefined;
        this.locked = true;
      } else {
        // Pointer was just unlocked
        // Disable the mousemove listener
        this.input.disengage();
        document.addEventListener("mouseup", this._requestLock,false);
        this.canvas.removeEventListener("drag", () => {}, false);
        this.canvas.onclick = () => {
          this.canvas.requestPointerLock();
        };
        this.locked = false;
      }
    };

    this._pointerInit();

    this.camera = new Camera(this.canvas);
    this.minimapCamera = new Camera(this.canvas, {
      zoom: .01,
      maxZoom: .01,
      minZoom: .01,
      viewport: {
        startX: .83,
        startY: .7,
        endX: 1,
        endY: 1,
        parent: this.camera
      }
    });

    this.input = new Input();

    this.worldInfo = worldInfo;

    this.keyclick = new Stinger('keyclick');
    this.titleStinger = new Stinger('titlestinger');
    this.enterGameStinger = new Stinger('entergamestinger');
    this.deathStinger = new Stinger('deathstinger');
    this.titleMusic = document.querySelector('#titlemusic');
    this.ambientLoop = document.querySelector('#ambientloop');

    this.titleScreen = new TitleScreen(this);
    this.gameScreen = new GameScreen(this);
    this.shipWaitScreen = new ShipWaitScreen(this);
    this.chooseShipScreen = new ChooseShipScreen(this);
    //this.nameWaitScreen = new NameWaitScreen(this);
    //this.nameScreen = new NameScreen(this);
    this.disconnectScreen = new DisconnectScreen(this);
    //this.builderScreen = new BuilderScreen(this);

    this.currentScreen = {};
    this.switchScreen(this.titleScreen);

    this.stars = {
      objs:[], 
      colors:[
        'white',
        'yellow'
      ]
    };

    generateStarField(this.stars);

    this.socket = io.connect();

    this.socket.on('grid', (grid) => {
      this.grid = grid;
      this.grid.z = .85;      
    });

    this.socket.on('shipList', (data) => {
      this.shipList = data;
    });

    this.socket.on('worldInfoInit', (data) => {
      this.worldInfo.pushWiInitData(data);
    });

    this.socket.on('worldInfo', (data) => {
      const deserializer = new Deserializer(data);
      this.worldInfo.pushWiData(deserializer.read(NetworkWorldInfo));
    });

    this.socket.on('ship', (shipInfo) => {
      this.worldInfo.addShip(shipInfo);
    });

    this.socket.on('ships', (ships) => {
      this.worldInfo.addShips(ships);
    });

    this.socket.on('disconnect', () => {
      console.log('socket disconnected');
    });
  }

  frame() {
    const now = Date.now().valueOf();
    let dt = (now - this.lastTime) / 1000;

    this.lastTime = Date.now().valueOf();
    this.draw(now, dt);

    const step = .004;
    if(dt > step * 8)
    {
        dt = step;
        console.log('throttle');
    }
    this.accumulator += dt;
    while(this.accumulator >= step){
      this.update(step);
      this.accumulator -= step;
    } 

    requestAnimationFrame(this.frame.bind(this));
  }

  update(dt) {
    if(this.currentScreen.update)
      this.currentScreen.update(dt);
    this.input.update();
  }

  draw(now, dt) {
    drawing.clearCamera(this.camera);
    drawing.drawAsteroids(this.stars.objs, this.stars.colors, this.camera);
    if(this.currentScreen.draw)
      this.currentScreen.draw(now, dt);
    if(!this.locked)
      drawing.drawLockedGraphic(this.camera);

    utilities.fillText(this.camera.ctx,'fps: ' + Math.floor(1 / dt), 15, 15, "8pt Orbitron", 'white');
  }

  switchScreen(screen) {
    this._switchScreen(screen, false, false);
  }

  enterModal(Modal, callback, ...args) {
    this._switchScreen(new Modal(this, this.currentScreen, callback, ...args), true, false);
  }

  exitModal(previousScreen) {
    this._switchScreen(previousScreen, false, true);
  }

  _switchScreen(screen, toModal, fromModal) {
    if(!toModal && this.currentScreen.onExit) this.currentScreen.onExit();
    if(screen.init && !screen.initialized) {
      screen.init();
      screen.initialized = true;
    }
    if(!fromModal && screen.onEnter) screen.onEnter();
    this.input.setListeners(screen.keyDown, screen.keyUp, screen.mouse);
    this.currentScreen = screen;
  }

  _pointerInit() {
    this.canvas.addEventListener("mouseup",this._requestLock);
    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', this._changeCallback, false);
    document.addEventListener('mozpointerlockchange', this._changeCallback, false);
    document.addEventListener('webkitpointerlockchange', this._changeCallback, false);
    this.canvas.requestPointerLock = this.canvas.requestPointerLock ||
      this.canvas.mozRequestPointerLock ||
      this.canvas.webkitRequestPointerLock;
    this.canvas.onselectstart = () => { return false; };
  }  
}

module.exports = Client;
},{"../server/Deserializer.js":25,"../server/NetworkWorldInfo.js":32,"../server/utilities.js":37,"./Camera.js":1,"./ChooseShipScreen.js":2,"./DisconnectScreen.js":4,"./GameScreen.js":6,"./Input.js":7,"./Oscillator.js":12,"./ShipWaitScreen.js":14,"./Stinger.js":15,"./TitleScreen.js":16,"./drawing.js":19,"./worldInfo.js":24}],4:[function(require,module,exports){
const Screen = require('./Screen.js');
const drawing = require('./drawing.js');

class DisconnectScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
  }

  draw(now, dt) {
    drawing.drawDisconnectScreen(this.client.camera);
  }

  keyDown(e) {
    if(e.key === 'Enter') {
      this.client.keyclick.play();
      this.client.switchScreen(this.client.chooseShipScreen);
    }
  }
}

module.exports = DisconnectScreen;
},{"./Screen.js":13,"./drawing.js":19}],5:[function(require,module,exports){
const Screen = require('./Screen.js');

class EntryScreen extends Screen {
  constructor(client, waitScreen, message) {
    super();
    this.client = client;
    this.waitScreen = waitScreen;
    this.message = message;
  }

  keyDown(e) {
    this.client.keyclick.play();
    if(e.key === 'Backspace'){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      this.client.switchScreen(this.waitScreen);
      this.client.socket.emit(this.message, this.entry);
    }
    else
      this.entry += e.key;
  }

  onEnter(){
    this.entry = "";
  }
}

module.exports = EntryScreen;
},{"./Screen.js":13}],6:[function(require,module,exports){
const TrackShuffler = require('./TrackShuffler.js');
const inputState = require('../server/inputState.js');
const drawing = require('./drawing.js');
const Screen = require('./Screen.js');
const keymap = require('./keymap.js');
const utilities = require('../server/utilities.js');
const requests = require('./requests.js');
const ModalEntryScreen = require('./ModalEntryScreen.js');

class GameScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;
    this.whoTime = 0;
    this.who = null;
    this.shipsTime = 0;
    this.ships = null;
    this.startTime = 0;
  }

  init() {
    this.musicShuffler = new TrackShuffler([
      'gameplay1', 
      'gameplay2', 
      'gameplay3'
    ], 15);
  }

  update(dt) {
    const client = this.client;
    const input = client.input;
    const titleMusic = client.titleMusic;
    const musicShuffler = this.musicShuffler;
    const ambientLoop = client.ambientLoop;
    const camera = client.camera;
    const myKeys = client.myKeys;
    const myMouse = client.myMouse;
    const mouseTimer = client.mouseTimer;
    const socket = client.socket;

    titleMusic.volume = utilities.clamp(0, titleMusic.volume - dt, 1);
    musicShuffler.update();
    ambientLoop.volume = utilities.clamp(0, ambientLoop.volume + dt, 1);
    //camera shenanigans
    //camera zoom controls
    if(input.isDown('ArrowUp') && camera.zoom <= camera.maxZoom)
      camera.zoom*=1+(3-1)*dt;
    if(input.isDown('ArrowDown') && camera.zoom >= camera.minZoom)
      camera.zoom*=1+(.33-1)*dt;
    if(input.wheel)
      camera.zoom*=1+(input.wheel/2000);
    if(camera.zoom>camera.maxZoom)
      camera.zoom = camera.maxZoom;
    else if(camera.zoom<camera.minZoom)
      camera.zoom = camera.minZoom;
  }

  draw(now, dt) {
    const worldInfo = this.client.worldInfo;
    const playerInfo = worldInfo.getPlayerInfo();
    const client = this.client;
    const camera = client.camera;
    const minimapCamera = client.minimapCamera;
    const grid = client.grid;
    let x;
    let y;

    if(playerInfo && playerInfo.isDrawable) {
      camera.lastX = camera.x;
      camera.lastY = camera.y;
      x = playerInfo.interpolateWiValue('x', now);
      y = playerInfo.interpolateWiValue('y', now);
      camera.x = x;// + playerInfo.interpolateWiValue('velocityX', now)/10;
      camera.y = y;// + playerInfo.interpolateWiValue('velocityY', now)/10;

      //console.log([camera.x - camera.lastX, camera.y - camera.lastY]);
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
    //console.log('player');
    //console.log(camera.worldPointToCameraSpace(x, y));
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

    if(now - this.whoTime < 6000)
      drawing.drawMultiLineText(camera, this.who, camera.width/10, camera.height/11, "12pt Orbitron");
    else if(now - this.shipsTime < 6000)
      drawing.drawMultiLineText(camera, this.ships, camera.width/10, camera.height/11, "12pt Orbitron");

    if(now - this.startTime < 15000)
      drawing.drawTutorialGraphics(camera);
  }

  keyDown(e) {
    const command = keymap[e.code];
    if(command || command === 0) {
      this.client.socket.emit('input', { command: command, pos: inputState.STATES.STARTING });
    }
    else if(e.key === 'Enter') {
      this.client.enterModal(ModalEntryScreen, (val) => {
        if(val === 'who') {
          requests.getRequest('/names', (names) => {
            let lines = ""
            for(let c = 0; c < names.length; ++c)
              lines += `${names[c]}\n`;
            this.who = lines;
            this.whoTime = Date.now();
          });
        }
        else if(val === 'ships') {
          requests.getRequest('/activeShips', (ships) => {
            let lines = "";
            Object.keys(ships).forEach((shipName) => {
              lines += `${shipName}: ${ships[shipName]}\n`;
            });
            this.ships = lines;
            this.shipsTime = Date.now();
          });
        }
      }, "Enter a command");
    }
  }
  
  keyUp(e) {
    const command = keymap[e.code];
    if(command || command === 0) {
      this.client.socket.emit('input', { command: keymap[e.code], pos: inputState.STATES.DISABLED });
    }
  }

  mouse(x) {
    this.client.socket.emit('input', { md: x });
  }

  onEnter() {
    this.musicShuffler.play();
    const client = this.client;
    client.enterGameStinger.play();
    this.startTime = Date.now();

    const socket = client.socket;
    socket.on('destroyed', () => {
      this.client.deathStinger.play();
      this.client.switchScreen(this.client.disconnectScreen);
    });
  }

  onExit() {
    this.musicShuffler.pause();
    this.client.socket.off('destroyed');
  }
}

module.exports = GameScreen;
},{"../server/inputState.js":34,"../server/utilities.js":37,"./ModalEntryScreen.js":10,"./Screen.js":13,"./TrackShuffler.js":17,"./drawing.js":19,"./keymap.js":20,"./requests.js":23}],7:[function(require,module,exports){
const LooseTimer = require('./LooseTimer.js');
const inputState = require('../server/inputState.js');

class Input {
  constructor() {
    this.keystate = {};
    this.wheel = 0;
    this.mouseX = 0;
    this.lastMouseX = 0;

    this.mouseTimer = new LooseTimer(50, () => {
      if(this.mouseX !== this.lastMouseX) {
        this.lastMouseX = this.mouseX;
        if(this.mouseListener)
          this.mouseListener(this.mouseX);
        this.mouseX = 0;
      }
    });  

    this._mousedown = (e) => {
      this.keystate[e.button] = 2;
        if(this.pressListener)
          this.pressListener({key: 'LMB', code: e.button});
    };

    this._mouseup = (e) => {
      this.keystate[e.button] = 0;
        if(this.releaseListener)
          this.releaseListener({key: 'LMB', code: e.button});
    };

    this._wheel = (e) => {
      this.wheel -= e.deltaY;
    };

    this._mousemove = (e) => {
      this.mouseX += e.movementX;
    };

    this._keydown = (e) => {
      if(!e.repeat) {
        this.keystate[e.code] = inputState.STATES.STARTING;

        if(this.pressListener)
          this.pressListener(e);
      }

      e.preventDefault();
      e.stopPropagation();
    };

    this._keyup = (e) => {
      this.keystate[e.code] = inputState.STATES.DISABLED;
      if(this.releaseListener)
        this.releaseListener(e);
      e.preventDefault();
      e.stopPropagation();
    };
  }

  // Called once per client update, after the screen's update
  update() {
    inputState.advanceStateDictionary.call(this.keystate);
    this.wheel = 0;
    this.mouseTimer.check();
  }

  isPress(code) {
    return inputState.isStarting(this.keystate[code]);
  }

  isDown(code) {
    return inputState.isEnabled(this.keystate[code]);
  }

  setListeners(press, release, mouse) {
    this.pressListener = press;
    this.releaseListener = release;
    this.mouseListener = mouse;
  }

  engage() {
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('mousedown', this._mousedown);
    window.addEventListener('mouseup', this._mouseup);
    window.addEventListener('wheel', this._wheel);
    window.addEventListener('mousemove', this._mousemove);
  }

  disengage() {
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('mousedown', this._mousedown);
    window.removeEventListener('mouseup', this._mouseup);
    window.removeEventListener('wheel', this._wheel);
    window.removeEventListener('mousemove', this._mousemove);
  }
}

module.exports = Input;
},{"../server/inputState.js":34,"./LooseTimer.js":8}],8:[function(require,module,exports){
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

module.exports = LooseTimer;
},{}],9:[function(require,module,exports){
class Menu {
  constructor(elements) {
    this.elements = elements;
    this.cursor = 0;
  }

  draw(ctx, x, y, font, active) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    const height = ctx.measureText("M").width;
    const lineHeight = height * 1.5;
    for (let i = this.elements.length - 1; i >= 0; --i) {
      if(active && this.cursor === i) {
        ctx.save();
        const width = ctx.measureText(this.elements[i].text).width;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'blue';
        ctx.fillRect(x - width/2, y - height/2, width, height);
        ctx.restore();
      }
      ctx.fillText(this.elements[i].text, x, y);
      y -= lineHeight;
    }
    ctx.restore();
  }

  forward() {
    this.cursor = (this.cursor + 1) % this.elements.length;
  }

  backward() {
    this.cursor = (this.cursor - 1) % this.elements.length;
  }

  select() {
    return this.elements[this.cursor].func(this.elements[this.cursor]);
  }

  key(e) {
    if(e.key === 'Enter')
      return this.select();
    else if(e.key === 'ArrowUp')
      this.backward();
    else if(e.key === 'ArrowDown')
      this.forward();
  }
}

module.exports = Menu;
},{}],10:[function(require,module,exports){
const ModalScreen = require('./ModalScreen.js');
const drawing = require('./drawing.js');

class ModalEntryScreen extends ModalScreen {
  constructor(client, previousScreen, callback, message) {
    super(client, previousScreen, callback);
    this.message = message;
  }

  draw(now, dt) {
    super.draw(now, dt);
    drawing.drawEntryScreen(this.client.camera, this.message, this.entry);
  }

  keyDown(e) {
    if(e.key === 'Backspace'){
      if(this.entry.length > 0)
        this.entry = this.entry.slice(0, -1);
    }
    else if(e.key === 'Enter') {
      const number = Number.parseFloat(this.entry);
      if(!Number.isNaN(number))
        this.exitModal(number);
      else if(this.entry === 'true' || this.entry === 'false')
        this.exitModal((this.entry === 'true') ? true : false);
      else
        this.exitModal(this.entry);
    }
    else
      this.entry += e.key;
  }

  onEnter(){
    this.entry = "";
  }
}

module.exports = ModalEntryScreen;
},{"./ModalScreen.js":11,"./drawing.js":19}],11:[function(require,module,exports){
const Screen = require('./Screen.js');
const drawing = require('./drawing.js');

class ModalScreen extends Screen {
  constructor(client, previousScreen, callback) {
    super();
    this.client = client;
    this.previousScreen = previousScreen;
    this.callback = callback;
  }

  update(dt) {
    if(this.previousScreen.update)
      this.previousScreen.update(dt);
  }

  draw(now, dt) {
    if(this.previousScreen.draw)
      this.previousScreen.draw(now, dt);
    const camera = this.client.camera;
    const ctx = camera.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawing.clearCamera(camera);
    ctx.restore();
  }

  exitModal(val) {
    this.client.exitModal(this.previousScreen);
    this.callback(val);
  }
}

module.exports = ModalScreen;
},{"./Screen.js":13,"./drawing.js":19}],12:[function(require,module,exports){
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

module.exports = Oscillator;
},{}],13:[function(require,module,exports){
require('./optionalBind.js');

class Screen {
  constructor() {
    this.optionalBind('keyDown');
    this.optionalBind('keyUp');
    this.optionalBind('mouse');
  }
}

module.exports = Screen;
},{"./optionalBind.js":22}],14:[function(require,module,exports){
const Screen = require('./Screen.js');

class ShipWaitScreen extends Screen {
  constructor(client) {
    super();
    this.optionalBind('checkGameStart');
    this.client = client;
    this.firstWI = false;
  }

  onEnter() {
    const client = this.client;
    const socket = client.socket;
    client.worldInfo.reset();
    socket.on('badShipError', client.switchScreen.bind(client, client.chooseShipScreen));
    socket.on('worldInfoInit', this.checkGameStart);
    socket.on('worldInfo', this.checkGameStart);
  }

  onExit() {
    const client = this.client;
    const socket = client.socket;
    socket.off('badShipError');
    socket.off('worldInfoInit', this.checkGameStart);
    socket.off('worldInfo', this.checkGameStart);
  }

  checkGameStart() {
    const wi = this.client.worldInfo;
    if(wi.initialized && wi.hasData)
      this.client.switchScreen(this.client.gameScreen);
  }
}

module.exports = ShipWaitScreen;
},{"./Screen.js":13}],15:[function(require,module,exports){
class Stinger {
  constructor(id) {
    this.elem = document.querySelector(`#${id}`);
  }

  play() {
    this.elem.currentTime = 0;
    this.elem.play();
  }
}

module.exports = Stinger;
},{}],16:[function(require,module,exports){
const Oscillator = require('./Oscillator.js');
const utilities = require('../server/utilities.js');
const drawing = require('./drawing.js');
const Screen = require('./Screen.js');
const Menu = require('./Menu.js');

class TitleScreen extends Screen {
  constructor(client) {
    super();
    this.client = client;

    this.titleOsc = new Oscillator(6);
    this.titleCameraOsc = new Oscillator(60);   
  }

  draw(now, dt) {
    const camera = this.client.camera;
    const nowS = now / 1000;
    camera.x = this.titleCameraOsc.getValue(nowS) * 100000;
    camera.y = this.titleCameraOsc.getValue(nowS + this.titleCameraOsc.period/4) * 100000;
    camera.rotation = utilities.correctOrientation(camera.rotation + .1 * dt);
    drawing.drawTitleScreen(camera, this.titleOsc, this.menu);
  }

  keyDown(e) {
    this.client.keyclick.play();  
    if(e.key === 'Enter')
      this.client.switchScreen(this.client.chooseShipScreen); 
  }

  onExit() {
    this.client.titleStinger.play();
  }
}

module.exports = TitleScreen;
},{"../server/utilities.js":37,"./Menu.js":9,"./Oscillator.js":12,"./Screen.js":13,"./drawing.js":19}],17:[function(require,module,exports){
const utilities = require('../server/utilities.js');

class TrackShuffler {
	constructor(trackNames, overlapSeconds = 0) {
		const tracks = [];
		for(const name of trackNames){
			const audio = new Audio();
			audio.setAttribute('src', `${name}.mp3`);
			tracks.push(audio);
			document.body.appendChild(audio);
		}
		this.tracks = tracks;
		this.currentTrack = tracks[0];
		this.currentTrackIndex = 0;
		this.previousTrack = undefined;
		this.overlapSeconds = overlapSeconds;
		this._playing = false;
	}

	play() {
		this._playing = true;
		this.currentTrack.play();
		if(this.previousTrack)
			this.previousTrack.play();
	}

	pause() {
		this._playing = false;
		this.currentTrack.pause();
		if(this.previousTrack)
			this.previousTrack.pause();
	}

	get playing() {
		return this._playing;
	}

	update() {
		if(this.currentTrack.currentTime >= this.currentTrack.duration - this.overlapSeconds) {
			this.previousTrack = this.currentTrack;
			this.currentTrackIndex = (utilities.getRandomIntInclusive(1, this.tracks.length - 1) + this.currentTrackIndex) % this.tracks.length;
			this.currentTrack = this.tracks[this.currentTrackIndex];
			if(this._playing)
				this.currentTrack.play();
		}
		if(this.previousTrack && this.previousTrack.currentTime >= this.previousTrack.duration) {
			this.previousTrack.currentTime = 0;
			this.previousTrack.pause();
			this.previousTrack = undefined;
		}
	}

	get volume() {
		return this.tracks[0].volume;
	}

	set volume(val) {
		for(let c = 0; c < this.tracks.length; c++) {
			this.tracks[c].volume = val;
		}
	}
}

module.exports = TrackShuffler;
},{"../server/utilities.js":37}],18:[function(require,module,exports){
class Viewport {
  constructor(objectParams = {}) {
    this.startX = (objectParams.startX) ? objectParams.startX : 0;
    this.startY = (objectParams.startY) ? objectParams.startY : 0;
    this.endX = (objectParams.endX) ? objectParams.endX : 1;
    this.endY = (objectParams.endY) ? objectParams.endY : 1;
    this.parent = objectParams.parent;
  }
}

module.exports = Viewport;
},{}],19:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

const utilities = require('../server/utilities.js');
const worldInfo = require('./worldInfo.js');

const thrusterDetail = 3;
const hitscanDetail = 3;

const upVector = [0, 1];
const downVector = [0, -1];
const rightVector = [1, 0];
const leftVector = [-1, 0];

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
    const color = ship.getMostRecentValue('color').colorString;

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
      ctx.arc(0, 0, 5*radius, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('shp', time)) - Math.PI / 2, true);
      ctx.strokeStyle = 'dodgerblue';
      ctx.lineWidth = 2*radius;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3*radius, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('hp', time)) - Math.PI / 2, true);
      ctx.strokeStyle = 'green';
      ctx.stroke();
    }
    if(ship.model.overlay.colorCircle){
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill(); 
      // ctx.beginPath();
      // ctx.arc(0, 0, radius, 0, Math.PI * 2);
      // ctx.fillStyle = 'black';
      // ctx.globalAlpha = 1;
      // ctx.fill();
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
    const color = ship.getMostRecentValue('color').colorString;
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
    //console.log(`Ship world: ${x}, ${y}`);
    const rotation = ship.interpolateRotationValue('rotation', time);
    const radius = ship.getMostRecentValue('radius');
    const thrusterColor = ship.getMostRecentValue('thrusterColor');
    const color = ship.getMostRecentValue('color').colorString;

    var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
    //console.log(`Ship camera: ${shipPosInCameraSpace[0]}, ${shipPosInCameraSpace[1]}`);
    if(shipPosInCameraSpace[0] - radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + radius * camera.zoom< 0
      || shipPosInCameraSpace[1] - radius * camera.zoom> camera.height || shipPosInCameraSpace[1] + radius * camera.zoom< 0)
      return;

    const states = ship.states;

    var ctx = camera.ctx;

    ctx.save();
    ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
    ctx.rotate((rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

    ctx.scale(camera.zoom,camera.zoom); //scale by zoom value

    //Thrusters
    var width = ship.model.thrusterPoints.width;
    //forward thrust
    for(var c = 0;c<=thrusterDetail;c++) {
      ctx.fillStyle = thrusterColor.shade(.5*c).colorString;
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
        ctx.fillStyle = hitscan.getMostRecentValue('color').shade(0 + c / (hitscanDetail + 1)).colorString;
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
      const ageSeconds = (time - worldInfo.interpDelay - prj.arrivalTime) / 1000;
      const velX = prj.velocityX;
      const velY = prj.velocityY;
      const x = prj.x + (ageSeconds * velX);
      const y = prj.y + (ageSeconds * velY);
      var start = camera.worldPointToCameraSpace(x, y);
      var end = camera.worldPointToCameraSpace(x - velX * dt, y - velY * dt);
      const radius = prj.radius;

      if(ageSeconds < 0 || start[0] > camera.width + radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius)
        continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.strokeStyle = prj.color.colorString;
      var width = radius*camera.zoom;
      ctx.lineWidth = (width>1)?width:1;
      ctx.lineCap = 'round';
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
      ctx.strokeStyle = radial.getMostRecentValue('color').colorString;
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
      for(var c = 0; c<asteroids.length;c++)
      {
        var asteroid = asteroids[c];
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
  drawAsteroids: function(asteroids, colors, camera){
    var start = [0,0];
    var end = [camera.width,camera.height];
    var ctx = camera.ctx;
    for(var group = 0;group<colors.length;group++){
      ctx.save()
      ctx.fillStyle = colors[group];
      ctx.beginPath();
      for(var c = 0;c<asteroids.length;c++){
        var asteroid = asteroids[c];
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
    ctx.fillStyle = 'black';
    ctx.fillRect(0,camera.height,camera.width, - 30);
    utilities.fillText(ctx, ((hudInfo.current.stabilized) ? 'assisted' : 'manual'), camera.width / 2, camera.height - 10, "bold 12pt Orbitron", (hudInfo.current.stabilized) ? 'green' : 'red');
    ctx.textAlign = 'left';
    utilities.fillText(ctx, 'limiter', 10, camera.height - 10, "8pt Orbitron", 'white');
    if(hudInfo.current.clampEnabled)
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

  drawMultiLineText(camera, text, x, y, font) {
    const ctx = camera.ctx;
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    var lineHeight = ctx.measureText("M").width * 1.2;
    var lines = text.split("\n");
    for (var i = lines.length - 1; i >= 0; --i) {
      ctx.fillText(lines[i], x, y);
      y += lineHeight;
    }
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
    drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
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

  drawTitleScreen:function(camera, osc, menu){
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
    if(menu) {
      menu.draw(ctx, camera.width / 2, 4 * camera.height / 5, "24pt Orbitron", true);
    }
    else {
      utilities.fillText(ctx,"Press ENTER to start",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
    }
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

  drawEntryScreen: function(camera, entryPrompt, entry) {
    const ctx = camera.ctx;
    ctx.save();
    ctx.fillStyle = "black",
    ctx.globalAlpha = .03;
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    utilities.fillText(ctx,entryPrompt+": "+entry,camera.width/2,camera.height/2 - 30,"24pt Aroma",'white');
    ctx.restore();
  },

  //draw pause screen in the given camera
  drawChooseShipScreen:function(camera, entry, shipList = []){
    var ctx = camera.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
    ctx.restore();
  },
};

module.exports = drawing;
},{"../server/utilities.js":37,"./worldInfo.js":24}],20:[function(require,module,exports){
const commands = require('../server/commands.js');
const keys = require('../server/keys.js');

const keymap = {
	KeyW: commands.FORWARD,
	KeyS: commands.BACKWARD,
	KeyA: commands.LEFT,
	KeyD: commands.RIGHT,
	ArrowRight: commands.CW,
	ArrowLeft: commands.CCW,
	ShiftLeft: commands.BOOST_THRUSTER,
	AltLeft: commands.BOOST_SHIELD,
	0: commands.FIRE,
	2: commands.BOOST_WEAPON,
	Tab: commands.TOGGLE_STABILIZER,
	KeyC: commands.TOGGLE_LIMITER,
	Space: commands.FIRE
};

module.exports = keymap;
},{"../server/commands.js":33,"../server/keys.js":35}],21:[function(require,module,exports){
const Client = require('./Client.js');

window.onload = () => {
	new Client().frame();
};
},{"./Client.js":3}],22:[function(require,module,exports){
Object.prototype.optionalBind = function(prop) {
	if(this[prop])
		this[prop] = this[prop].bind(this);
};
},{}],23:[function(require,module,exports){
module.exports = {
  getRequest(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      callback(JSON.parse(xhr.response));
    };
    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', "application/json");
    xhr.send();
    this.openRequests++;
  },

  postRequest(url, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.onload = () => {
      callback(xhr.status);
    };
    xhr.send(JSON.stringify(data));
  }
};
},{}],24:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/client.js

const utilities = require('../server/utilities.js');

const STATE_BUFFER_LENGTH = 3;
const BACKWARD_STATE_BUFFER_LENGTH = 1;

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
},{"../server/utilities.js":37}],25:[function(require,module,exports){
const { primitiveByteSizes, ARRAY_INDEX_TYPE } = require('./serializationConstants.js');

class Deserializer {
  constructor(buf) {
    this.dataView = new DataView(buf);
    this.cursor = 0;
  }

  alignCursor(alignment) {
    this.cursor += alignment - (this.cursor % alignment);
  }

  // type should be an actual constructor object for non-primitives, not a string
  read(Type, scaleFactor = 1) {
    const size = primitiveByteSizes[Type];
    let val;
    // Primitive
    if (size) {
      this.alignCursor(size);
      val = this.dataView[`get${Type}`](this.cursor) / scaleFactor;
      this.cursor += size;
    } else {
      // Object
      const serializableProperties = Type.serializableProperties;
      const opts = {};
      for (let c = 0; c < serializableProperties.length; c++) {
        const property = serializableProperties[c];
        if (property.isArray) {
          opts[property.key] = this.readArray(property.type, property.scaleFactor);
        } else {
          opts[property.key] = this.read(property.type, property.scaleFactor);
        }
      }
      val = new Type(opts);
    }

    return val;
  }

  readArray(type, scaleFactor = 1) {
    const val = [];
    const length = this.read(ARRAY_INDEX_TYPE);
    for (let c = 0; c < length; c++) { val.push(this.read(type, scaleFactor)); }
    return val;
  }
}

module.exports = Deserializer;

},{"./serializationConstants.js":36}],26:[function(require,module,exports){
class NetworkAsteroid {
  constructor(asteroid) {
    this.id = asteroid.id;
    this.x = asteroid.x;
    this.y = asteroid.y;
    this.colorIndex = asteroid.colorIndex;
    this.radius = asteroid.radius;
  }
}

NetworkAsteroid.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'colorIndex', type: 'Uint8' },
  { key: 'radius', type: 'Uint16' },
];

module.exports = NetworkAsteroid;

},{}],27:[function(require,module,exports){
const ColorHSL = require('./utilities.js').ColorHSL;

class NetworkHitscan {
  constructor(hitscan) {
    this.id = hitscan.id;
    this.startX = hitscan.startX;
    this.startY = hitscan.startY;
    this.endX = hitscan.endX;
    this.endY = hitscan.endY;
    this.color = hitscan.color;
    this.power = hitscan.power;
    this.efficiency = hitscan.efficiency;
  }
}

NetworkHitscan.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'startX', type: 'Float32' },
  { key: 'startY', type: 'Float32' },
  { key: 'endX', type: 'Float32' },
  { key: 'endY', type: 'Float32' },
  { key: 'color', type: ColorHSL },
  { key: 'power', type: 'Uint16' },
  { key: 'efficiency', type: 'Uint16' },
];

module.exports = NetworkHitscan;

},{"./utilities.js":37}],28:[function(require,module,exports){
const ColorHSL = require('./utilities.js').ColorHSL;

class NetworkObj {
  constructor(obj) {
    this.id = obj.id;
    this.x = obj.x;
    this.y = obj.y;
    this.rotation = obj.rotation;
    this.radius = obj.radius;
    this.shp = obj.shp;
    this.shc = obj.shc;
    this.hp = obj.hp;
    this.color = obj.color;
    this.medial = obj.medial;
    this.lateral = obj.lateral;
    this.rotational = obj.rotational;
    this.thrusterColor = obj.thrusterColor;
  }
}

NetworkObj.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'rotation', type: 'Int16', scaleFactor: 50 },
  { key: 'radius', type: 'Uint16' },
  { key: 'shp', type: 'Uint16', scaleFactor: 100 },
  { key: 'shc', type: 'Uint16', scaleFactor: 100 },
  { key: 'hp', type: 'Uint16', scaleFactor: 100 },
  { key: 'color', type: ColorHSL },
  { key: 'medial', type: 'Int16', scaleFactor: 10 },
  { key: 'lateral', type: 'Int16', scaleFactor: 10 },
  { key: 'rotational', type: 'Int16', scaleFactor: 10 },
  { key: 'thrusterColor', type: ColorHSL },
];

module.exports = NetworkObj;

},{"./utilities.js":37}],29:[function(require,module,exports){
class NetworkPlayerObj {
  constructor(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.velocityX = obj.velocityX;
    this.velocityY = obj.velocityY;
    this.rotation = obj.rotation;
    this.rotationalVelocity = obj.rotationalVelocity;
    this.clampMedial = obj.clampMedial;
    this.clampLateral = obj.clampLateral;
    this.clampRotational = obj.clampRotational;
    this.clampEnabled = obj.clampEnabled;
    this.stabilized = obj.stabilized;
    this.thrusterPower = obj.thrusterPower;
    this.weaponPower = obj.weaponPower;
    this.shieldPower = obj.shieldPower;
  }
}

NetworkPlayerObj.serializableProperties = [
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocityX', type: 'Float32' },
  { key: 'velocityY', type: 'Float32' },
  { key: 'rotation', type: 'Float32' },
  { key: 'rotationalVelocity', type: 'Float32' },
  { key: 'clampMedial', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampLateral', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampRotational', type: 'Uint16', scaleFactor: 10 },
  { key: 'clampEnabled', type: 'Uint8' },
  { key: 'stabilized', type: 'Uint8' },
  { key: 'thrusterPower', type: 'Uint8', scaleFactor: 255 },
  { key: 'weaponPower', type: 'Uint8', scaleFactor: 255 },
  { key: 'shieldPower', type: 'Uint8', scaleFactor: 255 },
];

module.exports = NetworkPlayerObj;

},{}],30:[function(require,module,exports){
const ColorRGB = require('./utilities.js').ColorRGB;

class NetworkPrj {
  constructor(prj) {
    this.id = prj.id;
    this.x = prj.x;
    this.y = prj.y;
    this.velocityX = prj.velocityX;
    this.velocityY = prj.velocityY;
    this.color = prj.color;
    this.radius = prj.radius;
  }
}

NetworkPrj.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocityX', type: 'Float32' },
  { key: 'velocityY', type: 'Float32' },
  { key: 'color', type: ColorRGB },
  { key: 'radius', type: 'Uint8' },
];

module.exports = NetworkPrj;

},{"./utilities.js":37}],31:[function(require,module,exports){
const ColorRGB = require('./utilities.js').ColorRGB;

class NetworkRadial {
  constructor(radial) {
    this.id = radial.id;
    this.x = radial.x;
    this.y = radial.y;
    this.velocity = radial.velocity;
    this.radius = radial.radius;
    this.color = radial.color;
  }
}

NetworkRadial.serializableProperties = [
  { key: 'id', type: 'Uint16' },
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' },
  { key: 'velocity', type: 'Float32' },
  { key: 'radius', type: 'Uint16' },
  { key: 'color', type: ColorRGB },
];

module.exports = NetworkRadial;

},{"./utilities.js":37}],32:[function(require,module,exports){
const NetworkObj = require('./NetworkObj.js');
const NetworkPlayerObj = require('./NetworkPlayerObj.js');
const NetworkAsteroid = require('./NetworkAsteroid.js');
const NetworkPrj = require('./NetworkPrj.js');
const NetworkHitscan = require('./NetworkHitscan.js');
const NetworkRadial = require('./NetworkRadial.js');

class NetworkAsteroidInfo {
  constructor({ created, destroyed }) {
    this.created = created;
    this.destroyed = destroyed;
  }
}

NetworkAsteroidInfo.serializableProperties = [
  { key: 'created', type: NetworkAsteroid, isArray: true },
  { key: 'destroyed', type: 'Uint16', isArray: true },
];

class NetworkPrjInfo {
  constructor({ created, destroyed }) {
    this.created = created;
    this.destroyed = destroyed;
  }
}

NetworkPrjInfo.serializableProperties = [
  { key: 'created', type: NetworkPrj, isArray: true },
  { key: 'destroyed', type: 'Uint16', isArray: true },
];

class NetworkWorldInfo {
  constructor({ stateIndex, objs, asteroids, prjs, hitscans, radials, playerInfo }) {
    this.stateIndex = stateIndex;
    this.objs = objs;
    this.asteroids = asteroids;
    this.prjs = prjs;
    this.hitscans = hitscans;
    this.radials = radials;
    this.playerInfo = playerInfo;
  }
}

NetworkWorldInfo.serializableProperties = [
  { key: 'stateIndex', type: 'Uint32' },
  { key: 'objs', type: NetworkObj, isArray: true },
  { key: 'asteroids', type: NetworkAsteroidInfo },
  { key: 'prjs', type: NetworkPrjInfo },
  { key: 'hitscans', type: NetworkHitscan, isArray: true },
  { key: 'radials', type: NetworkRadial, isArray: true },
  { key: 'playerInfo', type: NetworkPlayerObj },
];

module.exports = NetworkWorldInfo;

},{"./NetworkAsteroid.js":26,"./NetworkHitscan.js":27,"./NetworkObj.js":28,"./NetworkPlayerObj.js":29,"./NetworkPrj.js":30,"./NetworkRadial.js":31}],33:[function(require,module,exports){
const commandList = [
  'FORWARD',
  'BACKWARD',
  'LEFT',
  'RIGHT',
  'CW',
  'CCW',
  'FIRE',
  'BOOST_THRUSTER',
  'BOOST_SHIELD',
  'BOOST_WEAPON',
  'TOGGLE_STABILIZER',
  'TOGGLE_LIMITER',
];

const commands = {};

for (let c = 0; c < commandList.length; c++) {
  commands[commandList[c]] = c;
}

module.exports = commands;

},{}],34:[function(require,module,exports){
const STATES = {
  STARTING: 2,
  ENABLED: 1,
  DISABLED: 0,
};

const isStarting = stateVal => stateVal === STATES.STARTING;

const isEnabled = stateVal => stateVal === STATES.ENABLED || isStarting(stateVal);

const isDisabled = stateVal => stateVal === STATES.DISABLED;

const advanceState = (stateVal) => {
  if (stateVal === STATES.STARTING) { return STATES.ENABLED; }
  return stateVal;
};

const advanceStateDictionary = function asd() {
  const keys = Object.keys(this);
  for (let c = 0; c < keys.length; c++) {
    this[keys[c]] = advanceState(this[keys[c]]);
  }
};

module.exports = {
  STATES,
  isStarting,
  isEnabled,
  isDisabled,
  advanceStateDictionary,
};

},{}],35:[function(require,module,exports){
module.exports = Object.freeze({
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  ALT: 18,
  W: 87,
  A: 65,
  D: 68,
  S: 83,
  Q: 81,
  E: 69,
  TAB: 9,
  F: 70,
  R: 82,
  C: 67,
  P: 80,
  CTRL: 17,
  J: 74,
  K: 75,
  L: 76,
  ENTER: 13,
  LMB: 0,
  MMB: 1,
  RMB: 2,
});

},{}],36:[function(require,module,exports){
const primitiveByteSizes = {
  Float32: 4,
  Uint8: 1,
  Uint16: 2,
  Uint32: 4,
  Int16: 2,
};

const ARRAY_INDEX_TYPE = 'Uint32';

module.exports = { primitiveByteSizes, ARRAY_INDEX_TYPE };

},{}],37:[function(require,module,exports){
// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

const has = Object.prototype.hasOwnProperty;

class Capsule {
  constructor(x1, y1, x2, y2, r) {
    this.center1 = [x1, y1];
    this.center2 = [x2, y2];
    this.radius = r;
  }
}

class VelocityCapsule extends Capsule {
  constructor(object, dt) {
    super(
      object.x,
      object.y,
      object.x + (object.velocityX * dt),
      object.y + (object.velocityY * dt),
      object.destructible.radius,
    );
  }
}

class ColorRGB {
  constructor({ r, g, b }) {
    this.r = r;
    this.g = g;
    this.b = b;
    this._generateColorString();
  }

  _generateColorString() {
    this.colorString = `rgb(${this.r},${this.g},${this.b})`;
  }

  shade(percent) {
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * (-1) : percent;
    const r = Math.round((t - this.r) * p) + this.r;
    const g = Math.round((t - this.g) * p) + this.g;
    const b = Math.round((t - this.b) * p) + this.b;
    return new ColorRGB({ r, g, b });
  }
}

ColorRGB.serializableProperties = [
  { key: 'r', type: 'Uint8' },
  { key: 'g', type: 'Uint8' },
  { key: 'b', type: 'Uint8' },
];

class ColorHSL {
  constructor({ h, s, l }) {
    this.h = h;
    this.s = s;
    this.l = l;
    this.colorString = `hsl(${this.h},${this.s}%,${this.l}%)`;
  }

  shade(percent) {
    const t = percent < 0 ? 0 : 100;
    const p = percent < 0 ? percent * (-1) : percent;
    const l = Math.round((t - this.l) * p) + this.l;
    return new ColorHSL({ h: this.h, s: this.s, l });
  }
}

ColorHSL.serializableProperties = [
  { key: 'h', type: 'Uint16' },
  { key: 's', type: 'Uint8' },
  { key: 'l', type: 'Uint8' },
];

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
  getRandomIntIncExc: (min, max) => Math.floor((Math.random() * (max - min))) + min,
  getRandomIntInclusive: (min, max) => Math.floor((Math.random() * ((max - min) + 1))) + min,
  circlesIntersect: (c1, c2) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    return distance < c1.radius + c2.radius;
  },
  distanceSqrBetweenPoints(x1, y1, x2, y2) {
    return ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
  },
  ColorRGB,
  ColorHSL,
  // Function Name: getRandomColor()
  // returns a random color of alpha 1.0
  // http://paulirish.com/2009/random-hex-color-code-snippets/
  getRandomColor: () => {
    const red = Math.round((Math.random() * 200) + 55);
    const green = Math.round((Math.random() * 200) + 55);
    const blue = Math.round((Math.random() * 200) + 55);
    const color = new ColorRGB({ r: red, g: green, b: blue });
    // OR if you want to change alpha
    // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
    return color;
  },
  getRandomBrightColor: () => {
    const h = Math.round(Math.random() * 360);
    const color = new ColorHSL({ h, s: 100, l: 65 });
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
    let or = orientation;
    while (or > 180) { or -= 360; }
    while (or < -180) { or += 360; }

    return or;
  },

  rotationLerp: (from, to, percent) => {
    if (Math.abs(to - from) > 180) {
      const adjustment = (from > to) ? -360 : 360;
      return utilities.correctOrientation(utilities.lerp(from + adjustment, to, percent));
    }
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

  cross(p, q) {
    return ((p[0] * q[1]) - (p[1] * q[0]));
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

  Capsule,

  VelocityCapsule,

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

  // recursively merge src onto this, shallowly merging properties named "specialProperties"
  deepObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      // if the current attribute is an object in the source
      if (src[key] instanceof Object && !(src[key] instanceof Array)) {
        // if the current attribute isn't in the this, or isn't an object in the this
        if (!has.call(this, key)
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

  // merge src onto this, ignoring properties that are objects or arrays
  veryShallowObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      if (key === 'specialProperties') {
        if (!has.call(this, key)) { this[key] = {}; }
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

  // merge src onto this. objects and arrays are copied by reference
  shallowObjectMerge(src) {
    if (!src) { return this; }
    Object.keys(src).forEach((key) => {
      this[key] = src[key];
    });

    return this;
  },

  // copy src onto this, ignoring properties that aren't present in this
  // and properties that are objects or arrays
  veryShallowUnionOverwrite(src) {
    if (!src) { return this; }
    Object.keys(src).forEach((key) => {
      if (has.call(this, key)
        && !(src[key] instanceof Object || src[key] instanceof Array)) {
        this[key] = src[key];
      }
    });

    return this;
  },

  // copy src onto this recursively, ignoring properties that aren't present in this
  // To-do
  deepUnionOverwrite(src) {
    if (!src) { return this; }
    Object.keys(src).forEach((key) => {
      if (!has.call(this, key)) return;
      if (src[key] instanceof Object) {
        utilities.deepUnionOverwrite.call(this[key], src[key]);
      } else {
        this[key] = src[key];
      }
    });

    return this;
  },
};

module.exports = utilities;

},{}]},{},[21]);
