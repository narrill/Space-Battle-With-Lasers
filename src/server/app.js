const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

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

const files = fs.readdirSync(`${__dirname}/../../hosted/`);

const hostedFiles = {};
for (let c = 0; c < files.length; c++) {
  const fileName = files[c];
  hostedFiles[`/${fileName}`] = {
    data: readHostedFile(fileName),
    mimeType: getMimeTypeFromExtension(path.extname(fileName)),
  };
}

const Game = require('./Game.js');
const buildableBPs = require('./ComponentTypes.js').buildableBPs;
const objBlueprints = require('./objBlueprints.js');

const ships = objBlueprints.ships;
const Obj = require('./Obj.js');
const utilities = require('./utilities.js');

let shipList = Object.keys(ships);

const game = new Game();

const sendFile = (request, response, fileInfo) => {
  response.writeHead(200, { 'content-type': fileInfo.mimeType });
  response.end(fileInfo.data);
};

const onRequest = (request, response) => {
  const urlInfo = url.parse(request.url);
  let pathname = urlInfo.pathname;
  console.log(urlInfo.path);
  if (pathname === '/') { pathname = '/client.html'; }
  if (hostedFiles[pathname]) {
    sendFile(request, response, hostedFiles[pathname]);
  } else {
    response.writeHead(404);
    response.end();
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on port ${port}`);

const io = socketio(app);

const names = {};

io.on('connection', (s) => {
  let ship;
  s.emit('shipList', shipList);

  s.on('ship', (shipName) => {
    const chosenShipBP = ships[String(shipName).toLowerCase().valueOf()];
    if (chosenShipBP) {
      const bpCopy = utilities.deepObjectMerge.call({}, chosenShipBP);
      game.socketSubscriptions[s.id] = s;
      bpCopy.remoteInput = { specialProperties: { socket: s } };
      const shipModels = {};
      Object.values(game.objs).forEach((sh) => {
        shipModels[sh.id] = sh.model;
      });
      ship = new Obj(bpCopy, game, null, s.id);
      game.objs.push(ship);
      s.emit('grid', game.grid);
      s.emit('ships', shipModels);
    } else {
      s.emit('badShipError');
    }
  });

  s.on('input', (data) => {
    if (ship && ship.remoteInput) ship.remoteInput.messageHandler(data);
  });

  s.on('disconnect', () => {
    delete game.socketSubscriptions[s.id];
  });
});

game.loop();
