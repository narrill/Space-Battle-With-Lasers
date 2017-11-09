const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../../hosted/client.html`);
const js = fs.readFileSync(`${__dirname}/../../hosted/bundle.js`);
const fonts = {
  '/AROMA-Light.ttf': fs.readFileSync(`${__dirname}/../../hosted/AROMA-Light.ttf`),
  '/AROMA-Bold.ttf': fs.readFileSync(`${__dirname}/../../hosted/AROMA-Bold.ttf`),
  '/Prime-Regular.otf': fs.readFileSync(`${__dirname}/../../hosted/Prime-Regular.otf`),
  '/Orbitron-Light.ttf': fs.readFileSync(`${__dirname}/../../hosted/Orbitron-Light.ttf`),
  '/Orbitron-Black.ttf': fs.readFileSync(`${__dirname}/../../hosted/Orbitron-Black.ttf`),
};

const onRequest = (request, response) => {
  console.log(request.url);
  if (request.url === '/hosted/bundle.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' });
    response.end(js);
  } else if (fonts[request.url]) {
    response.writeHead(200, { 'content-type': 'application/font-sfnt' });
    response.end(fonts[request.url]);
  } else {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(index);
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on port ${port}`);

const dependencyCatch = require('./dependencyCatch.js');
const gameFunctions = dependencyCatch(require('./gameFunctions.js'));
const ships = require('./ships.js');
const constructors = dependencyCatch(require('./constructors.js'));
const utilities = require('./utilities.js');

const shipList = Object.keys(ships);

const BASE_GAME = {
  accumulator: 0,
  timeStep: 0.005,
  lastTime: 0, // used by calculateDeltaTime()
  runningTime: 0,
  updatables: [],
  otherShips: [],
  otherShipCount: 0,
  maxOtherShips: 6,
  factions: 4,
  respawnQueue: [],
  factionColors: [],
  hitscans: [],
  projectiles: [],
  radials: [],
  reportQueue: undefined,
  functionQueue: [],
  grid: {
    gridLines: 500, // number of grid lines
    gridSpacing: 100, // pixels per grid unit
    gridStart: [-125000, -125000], // corner anchor in world coordinates
    colors: [
      {
        color: '#1111FF',
        interval: 1000,
      },
      {
        color: 'blue',
        interval: 200,
      },
      {
        color: 'mediumblue',
        interval: 50,
        minimap: true,
      },
      {
        color: 'darkblue',
        interval: 10,
      },
      {
        color: 'navyblue',
        interval: 2,
      },
    ],
  },
  tileArray: undefined,
  asteroids: {
    total: 60,
    colors: [
      '#6B2A06',
      'sienna',
    ],
    objs: [],
  },
};

const game = gameFunctions.init.call(utilities.deepObjectMerge.call({}, BASE_GAME));

const io = socketio(app);
// to-do, network protocol

io.on('connection', (s) => {
  let ship;
  let sendToShip;
  s.emit('shipList', shipList);

  s.on('ship', (shipName) => {
    const chosenShip = ships[String(shipName).toLowerCase().valueOf()];
    if (chosenShip) {
      chosenShip.remoteInput = {};
      ship = constructors.createShip(chosenShip, game);
      ship.remoteInput.remoteSend = (data, msg) => { s.emit((msg) || 'worldInfo', data); };
      sendToShip = ship.remoteInput.messageHandler;
      game.otherShips.push(ship);
      s.emit('grid', game.grid);
    }
  });

  s.on('input', (data) => {
    if (sendToShip) sendToShip(data);
  });
});

// let accumulator = 0;
// let lastTickTime;
// const TICK_INTERVAL_MS = 50;

// const simulationLoop = (playerList) => {
//   const currentTime = Date.now();
//   const sinceLast = currentTime - lastTickTime;
//   accumulator += sinceLast;
//   lastTickTime = currentTime;

//   const playerIds = Object.keys(playerList);

//   while (accumulator >= TICK_INTERVAL_MS) {
//     accumulator -= TICK_INTERVAL_MS;
//     const dT = TICK_INTERVAL_MS / 1000;

//     for (let n = 0; n < playerIds.length; n++) {
//       const player = playerList[playerIds[n]];
//     }
//   }

//   for (let n = 0; n < playerIds.length; n++) {
//     const player = playerList[playerIds[n]];
//     io.sockets.emit('info', null);
//   }
// };

// lastTickTime = Date.now();
// setInterval(simulationLoop.bind(null, players), TICK_INTERVAL_MS);
