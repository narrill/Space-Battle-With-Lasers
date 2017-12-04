const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const path = require('path');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const readHostedFile = filePath => fs.readFileSync(`${__dirname}/../../hosted/${filePath}`);

// Extension should include leading .
const getMimeTypeFromExtension = (extension) => {
  switch (extension) {
    case ('.html'):
      return 'text/html';
    case ('.js'):
      return 'text/javascript';
    case ('.ttf'):
    case ('.otf'):
      return 'application/font-sfnt';
    case ('.mp3'):
      return 'audio/mpeg';
    case ('.wav'):
      return 'audio/wav';
    default:
      return undefined;
  }
};

const files = [
  'client.html',
  'bundle.js',
  'AROMA-Light.ttf',
  'AROMA-Bold.ttf',
  'Prime-Regular.otf',
  'Orbitron-Light.ttf',
  'Orbitron-Black.ttf',
  'title.mp3',
  'bundle.js',
  'gameplay1.mp3',
  'gameplay2.mp3',
  'gameplay3.mp3',
  'keyclick.wav',
  'titlestinger.wav',
  'entergamestinger.wav',
  'deathstinger.wav',
  'ambientloop.wav'
];

const hostedFiles = {};
for (let c = 0; c < files.length; c++) {
  const fileName = files[c];
  hostedFiles[fileName] = {
    data: readHostedFile(fileName),
    mimeType: getMimeTypeFromExtension(path.extname(fileName)),
  };
}

const onRequest = (request, response) => {
  console.log(request.url);
  if (request.url === '/') { request.url = '/client.html'; }
  const fileNames = Object.keys(hostedFiles);
  for (let c = 0; c < fileNames.length; c++) {
    const fileName = fileNames[c];
    if (request.url === `/${fileName}`) {
      const fileInfo = hostedFiles[fileName];
      response.writeHead(200, { 'content-type': fileInfo.mimeType });
      response.end(fileInfo.data);
      return;
    }
  }

  response.writeHead(404);
  response.end();
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
  timeStep: 0.0167,
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
  socketSubscriptions: {},
  grid: {
    gridLines: 500, // number of grid lines
    gridSpacing: 100, // pixels per grid unit
    gridStart: [-25000, -25000], // corner anchor in world coordinates
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
      game.socketSubscriptions[s.id] = s;
      chosenShip.remoteInput = {};
      const shipModels = {};
      Object.values(game.otherShips).forEach((sh) => {
        shipModels[sh.id] = sh.model;
      });
      ship = constructors.createShip(chosenShip, game, s.id);
      ship.remoteInput.remoteSend = (data, msg) => { s.emit((msg) || 'worldInfo', data); };
      sendToShip = ship.remoteInput.messageHandler;
      game.otherShips.push(ship);
      s.emit('grid', game.grid);
      s.emit('ships', shipModels);
    } else {
      s.emit('badShipError');
    }
  });

  s.on('input', (data) => {
    if (sendToShip) sendToShip(data);
  });

  s.on('disconnect', () => {
    sendToShip = undefined;
    delete game.socketSubscriptions[s.id];
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
