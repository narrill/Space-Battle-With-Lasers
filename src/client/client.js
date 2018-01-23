const TitleScreen = require('./TitleScreen.js');
const GameScreen = require('./GameScreen.js');
const ChooseShipScreen = require('./ChooseShipScreen.js');
const WaitScreen = require('./WaitScreen.js');
const DisconnectScreen = require('./DisconnectScreen.js');
const Camera = require('./Camera.js');
const Oscillator = require('./Oscillator.js');
const Stinger = require('./Stinger.js');
const worldInfo = require('./worldInfo.js');
const Deserializer = require('../server/Deserializer.js');
const NetworkWorldInfo = require('../server/NetworkWorldInfo.js');
const Input = require('./Input.js');
const drawing = require('./drawing.js');

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
    this.chooseShipScreen = new ChooseShipScreen(this);
    this.waitScreen = new WaitScreen(this);
    this.disconnectScreen = new DisconnectScreen(this);

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
  }

  switchScreen(screen) {
    if(this.currentScreen.onExit) this.currentScreen.onExit();
    if(screen.init && !screen.initialized) {
      screen.init();
      screen.initialized = true;
    }
    if(screen.onEnter) screen.onEnter();
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