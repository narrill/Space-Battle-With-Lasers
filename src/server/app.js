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
const accountStore = require('./accountStore.js');
const csrf = require('csurf');
const db = require('./db.js');
const sharedsession = require('express-socket.io-session');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const Game = require('./Game.js');
const objBlueprints = require('./objBlueprints.js');

const ships = objBlueprints.ships;
const Obj = require('./Obj.js');
const utilities = require('./utilities.js');

const has = Object.prototype.hasOwnProperty;

let shipList = Object.keys(ships);

const game = new Game();

const dbURL = process.env.MONGODB_URI || 'mongodb://localhost/SpaceBattle';

db.connect(dbURL).catch((err) => {
  throw err;
});

const router = require('./router.js');

const app = express();
const server = http.Server(app);
const io = socketio(server);

app.use('/assets', express.static(path.resolve(`${__dirname}/../../hosted/`)));
//app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
const session = expressSession({
  key: 'sessionid',
  store: accountStore,
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

io.use(sharedsession(session));

io.on('connection', (s) => {
  if(!s.handshake.session.account) {
    s.disconnect();
    return;
  }

  s.handshake.session.account.attachSocket(s);

  s.emit('currency', s.handshake.session.account.currency);

  const account = s.handshake.session.account;

  let inputHandler;

  const stockShipNamesAndCosts = {};
  Object.keys(ships).forEach((name) => {
    stockShipNamesAndCosts[name] = ships[name].buyCost;
  });

  const userShipNamesAndCosts = account.bpNamesAndCosts;
  s.emit('shipList', utilities.shallowObjectMerge.call(stockShipNamesAndCosts, userShipNamesAndCosts));

  s.on('ship', (shipName) => {
    const nameString = String(shipName).toLowerCase().valueOf();
    const chosenStockBP = ships[nameString];
    const chosenUserBP = account.getBP(nameString);
    const chosenShipBP = (chosenStockBP) ? chosenStockBP : chosenUserBP;
    if (chosenShipBP && s.handshake.session.account.trySubtract(chosenShipBP.buyCost)) {
      inputHandler = game.createPlayerObj(s, s.handshake.session.account.id, chosenShipBP);  
      s.emit('grid', game.grid);
    } else {
      s.emit('badShipError');
    }
  });

  s.on('input', (data) => {
    if (inputHandler) inputHandler(data);
  });

  s.on('disconnect', () => {
    delete game.socketSubscriptions[s.id];
  });
});

game.loop();
