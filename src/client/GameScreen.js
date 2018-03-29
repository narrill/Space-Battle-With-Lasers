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