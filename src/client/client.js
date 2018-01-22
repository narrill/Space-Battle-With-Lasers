const TitleScreen = require('./TitleScreen.js');
const GameScreen = require('./GameScreen.js');
const ChooseShipScreen = require('./ChooseShipScreen.js');
const WaitScreen = require('./WaitScreen.js');
const DisconnectScreen = require('./DisconnectScreen.js');
const Camera = require('./Camera.js');
const Oscillator = require('./Oscillator.js');
const Stinger = require('./Stinger.js');
const worldInfo = require('./worldInfo.js').worldInfo;
const modelInfo = require('./worldInfo.js').modelInfo;
const Deserializer = require('../server/Deserializer.js');
const NetworkWorldInfo = require('../server/NetworkWorldInfo.js');
const Input = require('./Input.js');

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

    this.canvas = document.querySelector('#mainCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

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

    this.currentScreen = this.titleScreen;

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
      shipList = data;
    });

    this.socket.on('worldInfoInit', (data) => {
      worldInfo.pushWiInitData(data);
    });

    this.socket.on('worldInfo', (data) => {
      const deserializer = new Deserializer(data);
      worldInfo.pushWiData(deserializer.read(NetworkWorldInfo));
    });

    this.socket.on('ship', (shipInfo) => {
      worldInfo.addShip(shipInfo);
    });

    this.socket.on('ships', (ships) => {
      worldInfo.addShips(ships);
    });
  }

  frame() {
    const now = Date.now().valueOf();
    let dt = (now-lastTime)/1000;

    this.lastTime = Date.now().valueOf();
    this.draw(camera, minimapCamera, dt);

    const step = .004;
    if(dt>step*8)
    {
        dt = step;
        console.log('throttle');
    }
    this.accumulator+=dt;
    while(this.accumulator>=step){
      this.update(step);
      this.accumulator-= step;
    } 

    requestAnimationFrame(this.frame);
  }

  update(dt) {
    if(this.currentScreen.update)
      this.currentScreen.update(dt);
    this.input.update();
  }

  draw(now, dt) {
    if(this.currentScreen.draw)
      this.currentScreen.draw(now, dt);
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
}

module.exports = Client;