const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const url = require('url');
const express = require('express');
const expressHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const compression = require('compression');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const csrf = require('csurf');
const mongoose = require('mongoose');
const sharedsession = require('express-socket.io-session');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const Game = require('./Game.js');
const buildableBPs = require('./ComponentTypes.js').buildableBPs;
const objBlueprints = require('./objBlueprints.js');

const ships = objBlueprints.ships;
const Obj = require('./Obj.js');
const utilities = require('./utilities.js');

let shipList = Object.keys(ships);

const game = new Game();

const dbURL = process.env.MONGODB_URI || 'mongodb://localhost/SpaceBattle';

mongoose.connect(dbURL, (err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

let redisURL = {
  hostname: 'localhost',
  port: 6379,
};
let redisPASS;

if (process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(':')[1];
}

const router = require('./router.js');

const app = express();
const server = http.Server(app);
const io = socketio(server);

app.use('/assets', express.static(path.resolve(`${__dirname}/../../hosted/`)));
//app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
app.disable('x-powered-by');
app.use(compression());
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
const session = expressSession({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS,
  }),
  secret: 'we in space now',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
});
app.use(session);
app.set('views', `${__dirname}/../views`);
app.engine('handlebars', expressHandlebars({ 
  defaultLayout: 'main',
  layoutsDir: 'src/views/layouts'
}));
app.set('view engine', 'handlebars');

//app.use(cookieParser());
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  console.log('Missing CSRF token');
  return false;
});

router(app);

server.listen(port, (err) => {
  if (err) {
    throw (err);
  }
  console.log(`Listening on port ${port}`);
});

const names = {};

io.use(sharedsession(session));
io.on('connection', (s) => {
  if(!s.handshake.session.account) {
    s.disconnect();
    return;
  }
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
