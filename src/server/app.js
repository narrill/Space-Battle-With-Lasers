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

const sendJSON = (request, response, json) => {
  if (request.headers.accept.includes('application/json')
    || request.headers.accept.includes('text/html')) {
    response.writeHead(200, { 'content-type': 'application/json' });
    if (request.method === 'GET') { response.end(JSON.stringify(json)); } else { response.end(); }
  } else {
    response.writeHead(400);
    response.end();
  }
};

const sendCode = (request, response, code) => {
  response.writeHead(code);
  response.end();
};

const endPoints = {
  '/names': (request, response) => { sendJSON(request, response, game.names); },
  '/activeShips': (request, response) => { sendJSON(request, response, game.activeShips); },
  '/components': (request, response) => { sendJSON(request, response, buildableBPs); },
  '/ship': (request, response, query) => {
    if (query.ship && ships[query.ship]) {
      sendJSON(request, response, Obj.completeBP(ships[query.ship]));
    } else { sendCode(request, response, 400); }
  },
  '/addShip': (request, response) => {
    const body = [];
    request.on('error', () => {
      sendCode(request, response, 400);
    });
    request.on('data', (chunk) => {
      body.push(chunk);
    });
    request.on('end', () => {
      const string = Buffer.concat(body).toString();
      const obj = JSON.parse(string);
      obj.bp = Obj.completeBP(obj.bp);
      if (objBlueprints.addShip(obj)) {
        shipList = Object.keys(ships);
        sendCode(request, response, 204);
      } else {
        sendCode(request, response, 400);
      }
    });
  },
};

const onRequest = (request, response) => {
  const urlInfo = url.parse(request.url);
  let pathname = urlInfo.pathname;
  const queryParams = querystring.parse(urlInfo.query);
  console.log(urlInfo.path);
  if (pathname === '/') { pathname = '/client.html'; }
  if (hostedFiles[pathname]) {
    sendFile(request, response, hostedFiles[pathname]);
  } else if (endPoints[pathname]) {
    endPoints[pathname](request, response, queryParams);
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
  let name;
  s.emit('shipList', shipList);

  s.on('ship', (shipName) => {
    const chosenShipBP = ships[String(shipName).toLowerCase().valueOf()];
    if (chosenShipBP) {
      const bpCopy = utilities.deepObjectMerge.call({}, chosenShipBP);
      game.socketSubscriptions[s.id] = s;
      bpCopy.remoteInput = { specialProperties: { socket: s } };
      bpCopy.name = name;
      const shipModels = {};
      Object.values(game.objs).forEach((sh) => {
        shipModels[sh.id] = sh.model;
      });
      ship = new Obj(bpCopy, game, s.id);
      game.objs.push(ship);
      s.emit('grid', game.grid);
      s.emit('ships', shipModels);
    } else {
      s.emit('badShipError');
    }
  });

  s.on('name', (pName) => {
    if (!names[pName]) {
      name = pName;
      names[pName] = true;
      s.emit('goodName');
    } else { s.emit('badName'); }
  });

  s.on('input', (data) => {
    if (ship && ship.remoteInput) ship.remoteInput.messageHandler(data);
  });

  s.on('disconnect', () => {
    delete game.socketSubscriptions[s.id];
    delete names[name];
  });
});

game.loop();
