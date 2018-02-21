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

const files = fs.readdirSync(`${__dirname}/../../hosted/`);

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

const Game = require('./Game.js');
const ships = require('./objBlueprints.js').ships;
const Obj = require('./Obj.js');
const utilities = require('./utilities.js');

const shipList = Object.keys(ships);

const game = new Game();

const names = {};

const io = socketio(app);

io.on('connection', (s) => {
  let ship;
  let name;
  s.emit('shipList', shipList);

  s.on('ship', (shipName) => {
    const chosenShipBP = ships[String(shipName).toLowerCase().valueOf()];
    if (chosenShipBP) {
      const bpCopy = utilities.deepObjectMerge.call({}, chosenShipBP);
      game.socketSubscriptions[s.id] = s;
      bpCopy.remoteInput = {specialProperties:{socket: s}};
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
    if(!names[pName]) {
      name = pName;
      names[pName] = true;
      s.emit('goodName');
    }
    else
      s.emit('badName');
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
