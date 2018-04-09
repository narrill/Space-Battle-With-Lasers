"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
    s(r[o]);
  }return s;
})({ 1: [function (require, module, exports) {
    var utilities = require('../server/utilities.js');
    var Viewport = require('./Viewport.js');

    var Camera = function () {
      function Camera(canvas) {
        var objectParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Camera);

        this.x = objectParams.x ? objectParams.x : 0;
        this.y = objectParams.y ? objectParams.y : 0;
        this.rotation = objectParams.rotation ? objectParams.rotation : 0;
        this.zoom = objectParams.zoom ? objectParams.zoom : 1;
        this.minZoom = objectParams.minZoom ? objectParams.minZoom : .2;
        this.maxZoom = objectParams.maxZoom ? objectParams.maxZoom : Number.MAX_VALUE;
        this.viewport = new Viewport(objectParams.viewport);

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
      }

      _createClass(Camera, [{
        key: "worldPointToCameraSpace",
        value: function worldPointToCameraSpace(xw, yw) {
          var zw = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

          var zoom = 1 / (1 / this.zoom + zw);
          var cameraToPointVector = [(xw - this.x) * zoom, (yw - this.y) * zoom];
          var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
          return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
        }
      }, {
        key: "width",
        get: function get() {
          return this.canvas.width;
        }
      }, {
        key: "height",
        get: function get() {
          return this.canvas.height;
        }
      }]);

      return Camera;
    }();

    module.exports = Camera;
  }, { "../server/utilities.js": 37, "./Viewport.js": 18 }], 2: [function (require, module, exports) {
    var EntryScreen = require('./EntryScreen.js');
    var drawing = require('./drawing.js');

    var ChooseShipScreen = function (_EntryScreen) {
      _inherits(ChooseShipScreen, _EntryScreen);

      function ChooseShipScreen(client) {
        _classCallCheck(this, ChooseShipScreen);

        var _this = _possibleConstructorReturn(this, (ChooseShipScreen.__proto__ || Object.getPrototypeOf(ChooseShipScreen)).call(this, client, client.shipWaitScreen, 'ship'));

        _this.client = client;
        return _this;
      }

      _createClass(ChooseShipScreen, [{
        key: "draw",
        value: function draw(now, dt) {
          drawing.drawEntryScreen(this.client.camera, "Enter ship name", this.entry);
          drawing.drawChooseShipScreen(this.client.camera, this.entry, this.client.shipList);
        }
      }]);

      return ChooseShipScreen;
    }(EntryScreen);

    module.exports = ChooseShipScreen;
  }, { "./EntryScreen.js": 5, "./drawing.js": 19 }], 3: [function (require, module, exports) {
    var TitleScreen = require('./TitleScreen.js');
    var GameScreen = require('./GameScreen.js');
    var ChooseShipScreen = require('./ChooseShipScreen.js');
    var ShipWaitScreen = require('./ShipWaitScreen.js');
    //const NameScreen = require('./NameScreen.js');
    //const NameWaitScreen = require('./NameWaitScreen.js');
    var DisconnectScreen = require('./DisconnectScreen.js');
    //const BuilderScreen = require('./BuilderScreen.js');
    var Camera = require('./Camera.js');
    var Oscillator = require('./Oscillator.js');
    var Stinger = require('./Stinger.js');
    var worldInfo = require('./worldInfo.js');
    var Deserializer = require('../server/Deserializer.js');
    var NetworkWorldInfo = require('../server/NetworkWorldInfo.js');
    var Input = require('./Input.js');
    var drawing = require('./drawing.js');
    var utilities = require('../server/utilities.js');

    var generateStarField = function generateStarField(stars) {
      var lower = -10000000;
      var upper = 10000000;
      var maxRadius = 8000;
      var minRadius = 2000;
      var minZ = 1000;
      var maxZ = 7000;
      for (var c = 0; c < 500; c++) {
        var group = Math.floor(Math.random() * stars.colors.length);
        stars.objs.push({
          x: Math.random() * (upper - lower) + lower,
          y: Math.random() * (upper - lower) + lower,
          z: Math.random() * (maxZ - minZ) + minZ,
          radius: Math.random() * (maxRadius - minRadius) + minRadius,
          colorIndex: group
        });
      }
    };

    var Client = function () {
      function Client() {
        var _this2 = this;

        _classCallCheck(this, Client);

        this.accumulator = 0;
        this.lastTime = 0;

        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', function () {
          _this2.canvas.width = window.innerWidth;
          _this2.canvas.height = window.innerHeight;
        });
        document.body.appendChild(this.canvas);

        this._requestLock = function () {
          _this2.canvas.requestPointerLock();
        };

        this._changeCallback = function () {
          if (document.pointerLockElement === _this2.canvas || document.mozPointerLockElement === _this2.canvas || document.webkitPointerLockElement === _this2.canvas) {
            // Pointer was just locked
            // Enable the mousemove listener
            window.removeEventListener("mouseup", _this2._requestLock, false);
            _this2.input.engage();
            _this2.canvas.addEventListener("drag", function () {}, false);
            _this2.canvas.onclick = undefined;
            _this2.locked = true;
          } else {
            // Pointer was just unlocked
            // Disable the mousemove listener
            _this2.input.disengage();
            document.addEventListener("mouseup", _this2._requestLock, false);
            _this2.canvas.removeEventListener("drag", function () {}, false);
            _this2.canvas.onclick = function () {
              _this2.canvas.requestPointerLock();
            };
            _this2.locked = false;
          }
        };

        this._pointerInit();

        this.camera = new Camera(this.canvas);
        this.minimapCamera = new Camera(this.canvas, {
          zoom: .02,
          maxZoom: .02,
          minZoom: .02,
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
        this.shipWaitScreen = new ShipWaitScreen(this);
        this.chooseShipScreen = new ChooseShipScreen(this);
        //this.nameWaitScreen = new NameWaitScreen(this);
        //this.nameScreen = new NameScreen(this);
        this.disconnectScreen = new DisconnectScreen(this);
        //this.builderScreen = new BuilderScreen(this);

        this.currentScreen = {};
        this.switchScreen(this.titleScreen);

        this.stars = {
          objs: [],
          colors: ['white', 'yellow']
        };

        generateStarField(this.stars);

        this.socket = io.connect();

        this.socket.on('grid', function (grid) {
          _this2.grid = grid;
          _this2.grid.z = .85;
        });

        this.socket.on('shipList', function (data) {
          _this2.shipList = data;
        });

        this.socket.on('worldInfoInit', function (data) {
          _this2.worldInfo.pushWiInitData(data);
        });

        this.socket.on('worldInfo', function (data) {
          var deserializer = new Deserializer(data);
          _this2.worldInfo.pushWiData(deserializer.read(NetworkWorldInfo));
        });

        this.socket.on('ship', function (shipInfo) {
          _this2.worldInfo.addShip(shipInfo);
        });

        this.socket.on('ships', function (ships) {
          _this2.worldInfo.addShips(ships);
        });

        this.socket.on('disconnect', function () {
          console.log('socket disconnected');
        });
      }

      _createClass(Client, [{
        key: "frame",
        value: function frame() {
          var now = Date.now().valueOf();
          var dt = (now - this.lastTime) / 1000;

          this.lastTime = Date.now().valueOf();
          this.draw(now, dt);

          var step = .004;
          if (dt > step * 8) {
            dt = step;
            console.log('throttle');
          }
          this.accumulator += dt;
          while (this.accumulator >= step) {
            this.update(step);
            this.accumulator -= step;
          }

          requestAnimationFrame(this.frame.bind(this));
        }
      }, {
        key: "update",
        value: function update(dt) {
          if (this.currentScreen.update) this.currentScreen.update(dt);
          this.input.update();
        }
      }, {
        key: "draw",
        value: function draw(now, dt) {
          drawing.clearCamera(this.camera);
          drawing.drawAsteroids(this.stars.objs, this.stars.colors, this.camera);
          if (this.currentScreen.draw) this.currentScreen.draw(now, dt);
          if (!this.locked) drawing.drawLockedGraphic(this.camera);

          utilities.fillText(this.camera.ctx, 'fps: ' + Math.floor(1 / dt), 15, 15, "8pt Orbitron", 'white');
        }
      }, {
        key: "switchScreen",
        value: function switchScreen(screen) {
          this._switchScreen(screen, false, false);
        }
      }, {
        key: "enterModal",
        value: function enterModal(Modal, callback) {
          for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
          }

          this._switchScreen(new (Function.prototype.bind.apply(Modal, [null].concat([this, this.currentScreen, callback], args)))(), true, false);
        }
      }, {
        key: "exitModal",
        value: function exitModal(previousScreen) {
          this._switchScreen(previousScreen, false, true);
        }
      }, {
        key: "_switchScreen",
        value: function _switchScreen(screen, toModal, fromModal) {
          if (!toModal && this.currentScreen.onExit) this.currentScreen.onExit();
          if (screen.init && !screen.initialized) {
            screen.init();
            screen.initialized = true;
          }
          if (!fromModal && screen.onEnter) screen.onEnter();
          this.input.setListeners(screen.keyDown, screen.keyUp, screen.mouse);
          this.currentScreen = screen;
        }
      }, {
        key: "_pointerInit",
        value: function _pointerInit() {
          this.canvas.addEventListener("mouseup", this._requestLock);
          // Hook pointer lock state change events
          document.addEventListener('pointerlockchange', this._changeCallback, false);
          document.addEventListener('mozpointerlockchange', this._changeCallback, false);
          document.addEventListener('webkitpointerlockchange', this._changeCallback, false);
          this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
          this.canvas.onselectstart = function () {
            return false;
          };
        }
      }]);

      return Client;
    }();

    module.exports = Client;
  }, { "../server/Deserializer.js": 25, "../server/NetworkWorldInfo.js": 32, "../server/utilities.js": 37, "./Camera.js": 1, "./ChooseShipScreen.js": 2, "./DisconnectScreen.js": 4, "./GameScreen.js": 6, "./Input.js": 7, "./Oscillator.js": 12, "./ShipWaitScreen.js": 14, "./Stinger.js": 15, "./TitleScreen.js": 16, "./drawing.js": 19, "./worldInfo.js": 24 }], 4: [function (require, module, exports) {
    var Screen = require('./Screen.js');
    var drawing = require('./drawing.js');

    var DisconnectScreen = function (_Screen) {
      _inherits(DisconnectScreen, _Screen);

      function DisconnectScreen(client) {
        _classCallCheck(this, DisconnectScreen);

        var _this3 = _possibleConstructorReturn(this, (DisconnectScreen.__proto__ || Object.getPrototypeOf(DisconnectScreen)).call(this));

        _this3.client = client;
        return _this3;
      }

      _createClass(DisconnectScreen, [{
        key: "draw",
        value: function draw(now, dt) {
          drawing.drawDisconnectScreen(this.client.camera);
        }
      }, {
        key: "keyDown",
        value: function keyDown(e) {
          if (e.key === 'Enter') {
            this.client.keyclick.play();
            this.client.switchScreen(this.client.chooseShipScreen);
          }
        }
      }]);

      return DisconnectScreen;
    }(Screen);

    module.exports = DisconnectScreen;
  }, { "./Screen.js": 13, "./drawing.js": 19 }], 5: [function (require, module, exports) {
    var Screen = require('./Screen.js');

    var EntryScreen = function (_Screen2) {
      _inherits(EntryScreen, _Screen2);

      function EntryScreen(client, waitScreen, message) {
        _classCallCheck(this, EntryScreen);

        var _this4 = _possibleConstructorReturn(this, (EntryScreen.__proto__ || Object.getPrototypeOf(EntryScreen)).call(this));

        _this4.client = client;
        _this4.waitScreen = waitScreen;
        _this4.message = message;
        return _this4;
      }

      _createClass(EntryScreen, [{
        key: "keyDown",
        value: function keyDown(e) {
          this.client.keyclick.play();
          if (e.key === 'Backspace') {
            if (this.entry.length > 0) this.entry = this.entry.slice(0, -1);
          } else if (e.key === 'Enter') {
            this.client.switchScreen(this.waitScreen);
            this.client.socket.emit(this.message, this.entry);
          } else this.entry += e.key;
        }
      }, {
        key: "onEnter",
        value: function onEnter() {
          this.entry = "";
        }
      }]);

      return EntryScreen;
    }(Screen);

    module.exports = EntryScreen;
  }, { "./Screen.js": 13 }], 6: [function (require, module, exports) {
    var TrackShuffler = require('./TrackShuffler.js');
    var inputState = require('../server/inputState.js');
    var drawing = require('./drawing.js');
    var Screen = require('./Screen.js');
    var keymap = require('./keymap.js');
    var utilities = require('../server/utilities.js');
    var requests = require('./requests.js');
    var ModalEntryScreen = require('./ModalEntryScreen.js');

    var GameScreen = function (_Screen3) {
      _inherits(GameScreen, _Screen3);

      function GameScreen(client) {
        _classCallCheck(this, GameScreen);

        var _this5 = _possibleConstructorReturn(this, (GameScreen.__proto__ || Object.getPrototypeOf(GameScreen)).call(this));

        _this5.client = client;
        _this5.whoTime = 0;
        _this5.who = null;
        _this5.shipsTime = 0;
        _this5.ships = null;
        _this5.startTime = 0;
        return _this5;
      }

      _createClass(GameScreen, [{
        key: "init",
        value: function init() {
          this.musicShuffler = new TrackShuffler(['gameplay1', 'gameplay2', 'gameplay3'], 15);
        }
      }, {
        key: "update",
        value: function update(dt) {
          var client = this.client;
          var input = client.input;
          var titleMusic = client.titleMusic;
          var musicShuffler = this.musicShuffler;
          var ambientLoop = client.ambientLoop;
          var camera = client.camera;
          var myKeys = client.myKeys;
          var myMouse = client.myMouse;
          var mouseTimer = client.mouseTimer;
          var socket = client.socket;

          titleMusic.volume = utilities.clamp(0, titleMusic.volume - dt, 1);
          musicShuffler.update();
          ambientLoop.volume = utilities.clamp(0, ambientLoop.volume + dt, 1);
          //camera shenanigans
          //camera zoom controls
          if (input.isDown('ArrowUp') && camera.zoom <= camera.maxZoom) camera.zoom *= 1 + (3 - 1) * dt;
          if (input.isDown('ArrowDown') && camera.zoom >= camera.minZoom) camera.zoom *= 1 + (.33 - 1) * dt;
          if (input.wheel) camera.zoom *= 1 + input.wheel / 2000;
          if (camera.zoom > camera.maxZoom) camera.zoom = camera.maxZoom;else if (camera.zoom < camera.minZoom) camera.zoom = camera.minZoom;
        }
      }, {
        key: "draw",
        value: function draw(now, dt) {
          var worldInfo = this.client.worldInfo;
          var playerInfo = worldInfo.getPlayerInfo();
          var client = this.client;
          var camera = client.camera;
          var minimapCamera = client.minimapCamera;
          var grid = client.grid;
          var x = void 0;
          var y = void 0;

          if (playerInfo && playerInfo.isDrawable) {
            camera.lastX = camera.x;
            camera.lastY = camera.y;
            x = playerInfo.interpolateWiValue('x', now);
            y = playerInfo.interpolateWiValue('y', now);
            camera.x = x; // + playerInfo.interpolateWiValue('velocityX', now)/10;
            camera.y = y; // + playerInfo.interpolateWiValue('velocityY', now)/10;

            //console.log([camera.x - camera.lastX, camera.y - camera.lastY]);
            var rotDiff = playerInfo.interpolateRotationValue('rotation', now) + playerInfo.interpolateWiValue('rotationalVelocity', now) / 10 - camera.rotation;
            if (rotDiff > 180) rotDiff -= 360;else if (rotDiff < -180) rotDiff += 360;
            camera.rotation += utilities.lerp(0, rotDiff, 12 * dt);
            //camera.rotation+=rotDiff;
            if (camera.rotation > 180) camera.rotation -= 360;else if (camera.rotation < -180) camera.rotation += 360;
            minimapCamera.x = camera.x;
            minimapCamera.y = camera.y;
            minimapCamera.rotation = camera.rotation;
          }

          if (grid) drawing.drawGrid(camera, grid);
          drawing.drawAsteroidsOverlay(worldInfo.asteroids, camera, grid);
          for (var n = 0; n < worldInfo.objs.length; n++) {
            var shipInfo = worldInfo.objs[n];
            if (shipInfo.isDrawable && shipInfo.hasModel) {
              shipInfo.model = worldInfo.getModel(shipInfo.getMostRecentValue('id'));
              drawing.drawShipOverlay(shipInfo, camera, grid, now);
            }
          }
          drawing.drawProjectiles(worldInfo.prjs, camera, dt, now);
          drawing.drawHitscans(worldInfo.hitscans, camera, now);
          //console.log('player');
          //console.log(camera.worldPointToCameraSpace(x, y));
          for (var c = 0; c < worldInfo.objs.length; c++) {
            var ship = worldInfo.objs[c];
            if (ship.isDrawable && ship.hasModel) {
              ship.model = worldInfo.getModel(ship.getMostRecentValue('id'));
              drawing.drawShip(ship, camera, now);
            }
          }
          drawing.drawRadials(worldInfo.radials, camera, dt, now);
          drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
          drawing.drawHUD(camera, now);
          drawing.drawMinimap(minimapCamera, grid, now);

          if (now - this.whoTime < 6000) drawing.drawMultiLineText(camera, this.who, camera.width / 10, camera.height / 11, "12pt Orbitron");else if (now - this.shipsTime < 6000) drawing.drawMultiLineText(camera, this.ships, camera.width / 10, camera.height / 11, "12pt Orbitron");

          if (now - this.startTime < 15000) drawing.drawTutorialGraphics(camera);
        }
      }, {
        key: "keyDown",
        value: function keyDown(e) {
          var _this6 = this;

          var command = keymap[e.code];
          if (command || command === 0) {
            this.client.socket.emit('input', { command: command, pos: inputState.STATES.STARTING });
          } else if (e.key === 'Enter') {
            this.client.enterModal(ModalEntryScreen, function (val) {
              if (val === 'who') {
                requests.getRequest('/names', function (names) {
                  var lines = "";
                  for (var c = 0; c < names.length; ++c) {
                    lines += names[c] + "\n";
                  }_this6.who = lines;
                  _this6.whoTime = Date.now();
                });
              } else if (val === 'ships') {
                requests.getRequest('/activeShips', function (ships) {
                  var lines = "";
                  Object.keys(ships).forEach(function (shipName) {
                    lines += shipName + ": " + ships[shipName] + "\n";
                  });
                  _this6.ships = lines;
                  _this6.shipsTime = Date.now();
                });
              }
            }, "Enter a command");
          }
        }
      }, {
        key: "keyUp",
        value: function keyUp(e) {
          var command = keymap[e.code];
          if (command || command === 0) {
            this.client.socket.emit('input', { command: keymap[e.code], pos: inputState.STATES.DISABLED });
          }
        }
      }, {
        key: "mouse",
        value: function mouse(x) {
          this.client.socket.emit('input', { md: x });
        }
      }, {
        key: "onEnter",
        value: function onEnter() {
          var _this7 = this;

          this.musicShuffler.play();
          var client = this.client;
          client.enterGameStinger.play();
          this.startTime = Date.now();

          var socket = client.socket;
          socket.on('destroyed', function () {
            _this7.client.deathStinger.play();
            _this7.client.switchScreen(_this7.client.disconnectScreen);
          });
        }
      }, {
        key: "onExit",
        value: function onExit() {
          this.musicShuffler.pause();
          this.client.socket.off('destroyed');
        }
      }]);

      return GameScreen;
    }(Screen);

    module.exports = GameScreen;
  }, { "../server/inputState.js": 34, "../server/utilities.js": 37, "./ModalEntryScreen.js": 10, "./Screen.js": 13, "./TrackShuffler.js": 17, "./drawing.js": 19, "./keymap.js": 20, "./requests.js": 23 }], 7: [function (require, module, exports) {
    var LooseTimer = require('./LooseTimer.js');
    var inputState = require('../server/inputState.js');

    var Input = function () {
      function Input() {
        var _this8 = this;

        _classCallCheck(this, Input);

        this.keystate = {};
        this.wheel = 0;
        this.mouseX = 0;
        this.lastMouseX = 0;

        this.mouseTimer = new LooseTimer(50, function () {
          if (_this8.mouseX !== _this8.lastMouseX) {
            _this8.lastMouseX = _this8.mouseX;
            if (_this8.mouseListener) _this8.mouseListener(_this8.mouseX);
            _this8.mouseX = 0;
          }
        });

        this._mousedown = function (e) {
          _this8.keystate[e.button] = 2;
          if (_this8.pressListener) _this8.pressListener({ key: 'LMB', code: e.button });
        };

        this._mouseup = function (e) {
          _this8.keystate[e.button] = 0;
          if (_this8.releaseListener) _this8.releaseListener({ key: 'LMB', code: e.button });
        };

        this._wheel = function (e) {
          _this8.wheel -= e.deltaY;
        };

        this._mousemove = function (e) {
          _this8.mouseX += e.movementX;
        };

        this._keydown = function (e) {
          if (!e.repeat) {
            _this8.keystate[e.code] = inputState.STATES.STARTING;

            if (_this8.pressListener) _this8.pressListener(e);
          }

          e.preventDefault();
          e.stopPropagation();
        };

        this._keyup = function (e) {
          _this8.keystate[e.code] = inputState.STATES.DISABLED;
          if (_this8.releaseListener) _this8.releaseListener(e);
          e.preventDefault();
          e.stopPropagation();
        };
      }

      // Called once per client update, after the screen's update


      _createClass(Input, [{
        key: "update",
        value: function update() {
          inputState.advanceStateDictionary.call(this.keystate);
          this.wheel = 0;
          this.mouseTimer.check();
        }
      }, {
        key: "isPress",
        value: function isPress(code) {
          return inputState.isStarting(this.keystate[code]);
        }
      }, {
        key: "isDown",
        value: function isDown(code) {
          return inputState.isEnabled(this.keystate[code]);
        }
      }, {
        key: "setListeners",
        value: function setListeners(press, release, mouse) {
          this.pressListener = press;
          this.releaseListener = release;
          this.mouseListener = mouse;
        }
      }, {
        key: "engage",
        value: function engage() {
          window.addEventListener('keydown', this._keydown);
          window.addEventListener('keyup', this._keyup);
          window.addEventListener('mousedown', this._mousedown);
          window.addEventListener('mouseup', this._mouseup);
          window.addEventListener('wheel', this._wheel);
          window.addEventListener('mousemove', this._mousemove);
        }
      }, {
        key: "disengage",
        value: function disengage() {
          window.removeEventListener('keydown', this._keydown);
          window.removeEventListener('keyup', this._keyup);
          window.removeEventListener('mousedown', this._mousedown);
          window.removeEventListener('mouseup', this._mouseup);
          window.removeEventListener('wheel', this._wheel);
          window.removeEventListener('mousemove', this._mousemove);
        }
      }]);

      return Input;
    }();

    module.exports = Input;
  }, { "../server/inputState.js": 34, "./LooseTimer.js": 8 }], 8: [function (require, module, exports) {
    var LooseTimer = function () {
      function LooseTimer(intervalMS, func) {
        _classCallCheck(this, LooseTimer);

        this.interval = intervalMS;
        this.lastTick = 0;
        this.func = func;
      }

      _createClass(LooseTimer, [{
        key: "check",
        value: function check() {
          var now = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Date.now().valueOf();

          var diffTicks = (now - this.lastTick) / this.interval;
          if (diffTicks >= 1) {
            this.lastTick += this.interval * Math.floor(diffTicks);
            this.func();
          }
        }
      }]);

      return LooseTimer;
    }();

    module.exports = LooseTimer;
  }, {}], 9: [function (require, module, exports) {
    var Menu = function () {
      function Menu(elements) {
        _classCallCheck(this, Menu);

        this.elements = elements;
        this.cursor = 0;
      }

      _createClass(Menu, [{
        key: "draw",
        value: function draw(ctx, x, y, font, active) {
          ctx.save();
          ctx.font = font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          var height = ctx.measureText("M").width;
          var lineHeight = height * 1.5;
          for (var i = this.elements.length - 1; i >= 0; --i) {
            if (active && this.cursor === i) {
              ctx.save();
              var width = ctx.measureText(this.elements[i].text).width;
              ctx.globalAlpha = 0.5;
              ctx.fillStyle = 'blue';
              ctx.fillRect(x - width / 2, y - height / 2, width, height);
              ctx.restore();
            }
            ctx.fillText(this.elements[i].text, x, y);
            y -= lineHeight;
          }
          ctx.restore();
        }
      }, {
        key: "forward",
        value: function forward() {
          this.cursor = (this.cursor + 1) % this.elements.length;
        }
      }, {
        key: "backward",
        value: function backward() {
          this.cursor = (this.cursor - 1) % this.elements.length;
        }
      }, {
        key: "select",
        value: function select() {
          return this.elements[this.cursor].func(this.elements[this.cursor]);
        }
      }, {
        key: "key",
        value: function key(e) {
          if (e.key === 'Enter') return this.select();else if (e.key === 'ArrowUp') this.backward();else if (e.key === 'ArrowDown') this.forward();
        }
      }]);

      return Menu;
    }();

    module.exports = Menu;
  }, {}], 10: [function (require, module, exports) {
    var ModalScreen = require('./ModalScreen.js');
    var drawing = require('./drawing.js');

    var ModalEntryScreen = function (_ModalScreen) {
      _inherits(ModalEntryScreen, _ModalScreen);

      function ModalEntryScreen(client, previousScreen, callback, message) {
        _classCallCheck(this, ModalEntryScreen);

        var _this9 = _possibleConstructorReturn(this, (ModalEntryScreen.__proto__ || Object.getPrototypeOf(ModalEntryScreen)).call(this, client, previousScreen, callback));

        _this9.message = message;
        return _this9;
      }

      _createClass(ModalEntryScreen, [{
        key: "draw",
        value: function draw(now, dt) {
          _get(ModalEntryScreen.prototype.__proto__ || Object.getPrototypeOf(ModalEntryScreen.prototype), "draw", this).call(this, now, dt);
          drawing.drawEntryScreen(this.client.camera, this.message, this.entry);
        }
      }, {
        key: "keyDown",
        value: function keyDown(e) {
          if (e.key === 'Backspace') {
            if (this.entry.length > 0) this.entry = this.entry.slice(0, -1);
          } else if (e.key === 'Enter') {
            var number = Number.parseFloat(this.entry);
            if (!Number.isNaN(number)) this.exitModal(number);else if (this.entry === 'true' || this.entry === 'false') this.exitModal(this.entry === 'true' ? true : false);else this.exitModal(this.entry);
          } else this.entry += e.key;
        }
      }, {
        key: "onEnter",
        value: function onEnter() {
          this.entry = "";
        }
      }]);

      return ModalEntryScreen;
    }(ModalScreen);

    module.exports = ModalEntryScreen;
  }, { "./ModalScreen.js": 11, "./drawing.js": 19 }], 11: [function (require, module, exports) {
    var Screen = require('./Screen.js');
    var drawing = require('./drawing.js');

    var ModalScreen = function (_Screen4) {
      _inherits(ModalScreen, _Screen4);

      function ModalScreen(client, previousScreen, callback) {
        _classCallCheck(this, ModalScreen);

        var _this10 = _possibleConstructorReturn(this, (ModalScreen.__proto__ || Object.getPrototypeOf(ModalScreen)).call(this));

        _this10.client = client;
        _this10.previousScreen = previousScreen;
        _this10.callback = callback;
        return _this10;
      }

      _createClass(ModalScreen, [{
        key: "update",
        value: function update(dt) {
          if (this.previousScreen.update) this.previousScreen.update(dt);
        }
      }, {
        key: "draw",
        value: function draw(now, dt) {
          if (this.previousScreen.draw) this.previousScreen.draw(now, dt);
          var camera = this.client.camera;
          var ctx = camera.ctx;
          ctx.save();
          ctx.globalAlpha = 0.5;
          drawing.clearCamera(camera);
          ctx.restore();
        }
      }, {
        key: "exitModal",
        value: function exitModal(val) {
          this.client.exitModal(this.previousScreen);
          this.callback(val);
        }
      }]);

      return ModalScreen;
    }(Screen);

    module.exports = ModalScreen;
  }, { "./Screen.js": 13, "./drawing.js": 19 }], 12: [function (require, module, exports) {
    var Oscillator = function () {
      function Oscillator(periodSeconds) {
        _classCallCheck(this, Oscillator);

        this.start = Date.now() / 1000;
        this._period = periodSeconds;
      }

      _createClass(Oscillator, [{
        key: "getValue",
        value: function getValue(t) {
          return Math.sin(2 * Math.PI * (t + this.start) / this.period);
        }
      }, {
        key: "restart",
        value: function restart(t) {
          this.start = t;
        }
      }, {
        key: "period",
        get: function get() {
          return this._period;
        }
      }]);

      return Oscillator;
    }();

    module.exports = Oscillator;
  }, {}], 13: [function (require, module, exports) {
    require('./optionalBind.js');

    var Screen = function Screen() {
      _classCallCheck(this, Screen);

      this.optionalBind('keyDown');
      this.optionalBind('keyUp');
      this.optionalBind('mouse');
    };

    module.exports = Screen;
  }, { "./optionalBind.js": 22 }], 14: [function (require, module, exports) {
    var Screen = require('./Screen.js');

    var ShipWaitScreen = function (_Screen5) {
      _inherits(ShipWaitScreen, _Screen5);

      function ShipWaitScreen(client) {
        _classCallCheck(this, ShipWaitScreen);

        var _this11 = _possibleConstructorReturn(this, (ShipWaitScreen.__proto__ || Object.getPrototypeOf(ShipWaitScreen)).call(this));

        _this11.optionalBind('checkGameStart');
        _this11.client = client;
        _this11.firstWI = false;
        return _this11;
      }

      _createClass(ShipWaitScreen, [{
        key: "onEnter",
        value: function onEnter() {
          var client = this.client;
          var socket = client.socket;
          client.worldInfo.reset();
          socket.on('badShipError', client.switchScreen.bind(client, client.chooseShipScreen));
          socket.on('worldInfoInit', this.checkGameStart);
          socket.on('worldInfo', this.checkGameStart);
        }
      }, {
        key: "onExit",
        value: function onExit() {
          var client = this.client;
          var socket = client.socket;
          socket.off('badShipError');
          socket.off('worldInfoInit', this.checkGameStart);
          socket.off('worldInfo', this.checkGameStart);
        }
      }, {
        key: "checkGameStart",
        value: function checkGameStart() {
          var wi = this.client.worldInfo;
          if (wi.initialized && wi.hasData) this.client.switchScreen(this.client.gameScreen);
        }
      }]);

      return ShipWaitScreen;
    }(Screen);

    module.exports = ShipWaitScreen;
  }, { "./Screen.js": 13 }], 15: [function (require, module, exports) {
    var Stinger = function () {
      function Stinger(id) {
        _classCallCheck(this, Stinger);

        this.elem = document.querySelector("#" + id);
      }

      _createClass(Stinger, [{
        key: "play",
        value: function play() {
          this.elem.currentTime = 0;
          this.elem.play();
        }
      }]);

      return Stinger;
    }();

    module.exports = Stinger;
  }, {}], 16: [function (require, module, exports) {
    var Oscillator = require('./Oscillator.js');
    var utilities = require('../server/utilities.js');
    var drawing = require('./drawing.js');
    var Screen = require('./Screen.js');
    var Menu = require('./Menu.js');

    var TitleScreen = function (_Screen6) {
      _inherits(TitleScreen, _Screen6);

      function TitleScreen(client) {
        _classCallCheck(this, TitleScreen);

        var _this12 = _possibleConstructorReturn(this, (TitleScreen.__proto__ || Object.getPrototypeOf(TitleScreen)).call(this));

        _this12.client = client;

        _this12.titleOsc = new Oscillator(6);
        _this12.titleCameraOsc = new Oscillator(60);
        return _this12;
      }

      _createClass(TitleScreen, [{
        key: "draw",
        value: function draw(now, dt) {
          var camera = this.client.camera;
          var nowS = now / 1000;
          camera.x = this.titleCameraOsc.getValue(nowS) * 100000;
          camera.y = this.titleCameraOsc.getValue(nowS + this.titleCameraOsc.period / 4) * 100000;
          camera.rotation = utilities.correctOrientation(camera.rotation + .1 * dt);
          drawing.drawTitleScreen(camera, this.titleOsc, this.menu);
        }
      }, {
        key: "keyDown",
        value: function keyDown(e) {
          this.client.keyclick.play();
          if (e.key === 'Enter') this.client.switchScreen(this.client.chooseShipScreen);
        }
      }, {
        key: "onExit",
        value: function onExit() {
          this.client.titleStinger.play();
        }
      }]);

      return TitleScreen;
    }(Screen);

    module.exports = TitleScreen;
  }, { "../server/utilities.js": 37, "./Menu.js": 9, "./Oscillator.js": 12, "./Screen.js": 13, "./drawing.js": 19 }], 17: [function (require, module, exports) {
    var utilities = require('../server/utilities.js');

    var TrackShuffler = function () {
      function TrackShuffler(trackNames) {
        var overlapSeconds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        _classCallCheck(this, TrackShuffler);

        var tracks = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = trackNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var name = _step.value;

            var audio = new Audio();
            audio.setAttribute('src', "assets/" + name + ".mp3");
            tracks.push(audio);
            document.body.appendChild(audio);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        this.tracks = tracks;
        this.currentTrack = tracks[0];
        this.currentTrackIndex = 0;
        this.previousTrack = undefined;
        this.overlapSeconds = overlapSeconds;
        this._playing = false;
      }

      _createClass(TrackShuffler, [{
        key: "play",
        value: function play() {
          this._playing = true;
          this.currentTrack.play();
          if (this.previousTrack) this.previousTrack.play();
        }
      }, {
        key: "pause",
        value: function pause() {
          this._playing = false;
          this.currentTrack.pause();
          if (this.previousTrack) this.previousTrack.pause();
        }
      }, {
        key: "update",
        value: function update() {
          if (this.currentTrack.currentTime >= this.currentTrack.duration - this.overlapSeconds) {
            this.previousTrack = this.currentTrack;
            this.currentTrackIndex = (utilities.getRandomIntInclusive(1, this.tracks.length - 1) + this.currentTrackIndex) % this.tracks.length;
            this.currentTrack = this.tracks[this.currentTrackIndex];
            if (this._playing) this.currentTrack.play();
          }
          if (this.previousTrack && this.previousTrack.currentTime >= this.previousTrack.duration) {
            this.previousTrack.currentTime = 0;
            this.previousTrack.pause();
            this.previousTrack = undefined;
          }
        }
      }, {
        key: "playing",
        get: function get() {
          return this._playing;
        }
      }, {
        key: "volume",
        get: function get() {
          return this.tracks[0].volume;
        },
        set: function set(val) {
          for (var c = 0; c < this.tracks.length; c++) {
            this.tracks[c].volume = val;
          }
        }
      }]);

      return TrackShuffler;
    }();

    module.exports = TrackShuffler;
  }, { "../server/utilities.js": 37 }], 18: [function (require, module, exports) {
    var Viewport = function Viewport() {
      var objectParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, Viewport);

      this.startX = objectParams.startX ? objectParams.startX : 0;
      this.startY = objectParams.startY ? objectParams.startY : 0;
      this.endX = objectParams.endX ? objectParams.endX : 1;
      this.endY = objectParams.endY ? objectParams.endY : 1;
      this.parent = objectParams.parent;
    };

    module.exports = Viewport;
  }, {}], 19: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

    var utilities = require('../server/utilities.js');
    var worldInfo = require('./worldInfo.js');

    var thrusterDetail = 3;
    var hitscanDetail = 3;

    var upVector = [0, 1];
    var downVector = [0, -1];
    var rightVector = [1, 0];
    var leftVector = [-1, 0];

    var drawing = {
      //clears the given camera's canvas
      clearCamera: function clearCamera(camera) {
        var ctx = camera.ctx;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.fill();
      },

      // Draws the grid graphic. This could use some improving, but whatever
      drawGrid: function drawGrid(camera, grid) {
        var ctx = camera.ctx;
        var gridLines = grid.gridLines;
        var gridSpacing = grid.gridSpacing;
        var gridStart = grid.gridStart;

        for (var c = 0; c < grid.colors.length; c++) {
          ctx.save();
          ctx.beginPath();
          for (var x = 0; x <= gridLines; x++) {
            if (x % grid.colors[c].interval != 0) continue;
            var correctInterval = true;
            for (var n = 0; n < c; n++) {
              if (x % grid.colors[n].interval == 0) {
                correctInterval = false;
                break;
              }
            }
            if (correctInterval != true) continue;

            //define start and end points for current line in world space
            var start = [gridStart[0] + x * gridSpacing, gridStart[1]];
            var end = [start[0], gridStart[1] + gridLines * gridSpacing];

            //convert to camera space
            start = camera.worldPointToCameraSpace(start[0], start[1], grid.z);
            end = camera.worldPointToCameraSpace(end[0], end[1], grid.z);
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
          }
          for (var y = 0; y <= gridLines; y++) {
            if (y % grid.colors[c].interval != 0) continue;
            var _correctInterval = true;
            for (var _n = 0; _n < c; _n++) {
              if (y % grid.colors[_n].interval == 0) {
                _correctInterval = false;
                break;
              }
            }
            if (_correctInterval != true) continue;

            //same as above, but perpendicular
            var _start = [gridStart[0], gridStart[0] + y * gridSpacing];
            var _end = [gridStart[0] + gridLines * gridSpacing, _start[1]];
            _start = camera.worldPointToCameraSpace(_start[0], _start[1], grid.z);
            _end = camera.worldPointToCameraSpace(_end[0], _end[1], grid.z);
            ctx.moveTo(_start[0], _start[1]);
            ctx.lineTo(_end[0], _end[1]);
          }

          //draw all lines, stroke last
          ctx.globalAlpha = .3;
          ctx.strokeWidth = 5;
          ctx.strokeStyle = grid.colors[c].color;
          ctx.stroke();
          ctx.restore();
        }
      },

      //draws the projected overlay (shields, health, laser range) for the given ship using the two given cameras (one for the gameplay plane and one for the projected plane)
      drawShipOverlay: function drawShipOverlay(ship, camera, grid, time) {
        var ctx = camera.ctx;
        var gridZ = grid.z;
        var gridZoom = 1 / (gridZ + 1 / camera.zoom);
        var x = ship.interpolateWiValue('x', time);
        var y = ship.interpolateWiValue('y', time);
        var rotation = ship.interpolateWiValue('rotation', time);
        var radius = ship.getMostRecentValue('radius');
        var color = ship.getMostRecentValue('color').colorString;

        var shipPosInCameraSpace = camera.worldPointToCameraSpace(x, y); //get ship's position in camera space
        var shipPosInGridCameraSpace = camera.worldPointToCameraSpace(x, y, gridZ);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shipPosInCameraSpace[0], shipPosInCameraSpace[1]);
        ctx.lineTo(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.rotate((rotation - camera.rotation) * (Math.PI / 180));
        for (var type in ship.model.overlay.ranges) {
          ctx.arc(0, 0, ship.model.overlay.ranges[type] * gridZoom, -Math.PI / 2, Math.PI * 2 - Math.PI / 2);
        }
        ctx.rotate(-(rotation - camera.rotation) * (Math.PI / 180));
        ctx.translate(-shipPosInGridCameraSpace[0], -shipPosInGridCameraSpace[1]);
        ctx.lineWidth = .5;
        ctx.strokeStyle = 'grey';
        ctx.globalAlpha = .2;
        ctx.stroke();

        ctx.globalAlpha = .5;
        ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.scale(gridZoom, gridZoom);
        if (ship.model.overlay.destructible) {
          ctx.beginPath();
          ctx.arc(0, 0, 5 * radius, -Math.PI / 2, -Math.PI * 2 * ship.interpolateWiValue('shp', time) - Math.PI / 2, true);
          ctx.strokeStyle = 'dodgerblue';
          ctx.lineWidth = 2 * radius;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 3 * radius, -Math.PI / 2, -Math.PI * 2 * ship.interpolateWiValue('hp', time) - Math.PI / 2, true);
          ctx.strokeStyle = 'green';
          ctx.stroke();
        }
        if (ship.model.overlay.colorCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          // ctx.beginPath();
          // ctx.arc(0, 0, radius, 0, Math.PI * 2);
          // ctx.fillStyle = 'black';
          // ctx.globalAlpha = 1;
          // ctx.fill();
        } else {
          ctx.scale(1 / gridZoom, 1 / gridZoom);
          ctx.beginPath();
          ctx.moveTo(radius * gridZoom, 0);
          ctx.arc(0, 0, radius * gridZoom, 0, Math.PI * 2);
          ctx.globalAlpha = .2;
          ctx.lineWidth = .5;
          ctx.strokeStyle = 'grey';
          ctx.stroke();
        }
        ctx.restore();
      },

      //draws the give ship's minimap representation to the given camera
      drawShipMinimap: function drawShipMinimap(ship, camera, time) {
        var ctx = camera.ctx;
        ctx.save();
        var x = ship.interpolateWiValue('x', time);
        var y = ship.interpolateWiValue('y', time);
        var rotation = ship.interpolateRotationValue('rotation', time);
        var color = ship.getMostRecentValue('color').colorString;
        var shipPosInCameraSpace = camera.worldPointToCameraSpace(x, y); //get ship's position in camera space
        ctx.translate(shipPosInCameraSpace[0], shipPosInCameraSpace[1]); //translate to camera space position
        ctx.rotate((rotation - camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

        ctx.scale(.5, .5); //scale by zoom value

        //ctx.translate(0,7);
        ctx.beginPath();
        ctx.moveTo(ship.model.vertices[0][0], ship.model.vertices[0][1]);
        for (var c = 1; c < ship.model.vertices.length; c++) {
          var vert = ship.model.vertices[c];
          ctx.lineTo(vert[0], vert[1]);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      },

      //draws the given ship in the given camera
      drawShip: function drawShip(ship, camera, time) {
        var x = ship.interpolateWiValue('x', time);
        var y = ship.interpolateWiValue('y', time);
        //console.log(`Ship world: ${x}, ${y}`);
        var rotation = ship.interpolateRotationValue('rotation', time);
        var radius = ship.getMostRecentValue('radius');
        var thrusterColor = ship.getMostRecentValue('thrusterColor');
        var color = ship.getMostRecentValue('color').colorString;

        var shipPosInCameraSpace = camera.worldPointToCameraSpace(x, y); //get ship's position in camera space
        //console.log(`Ship camera: ${shipPosInCameraSpace[0]}, ${shipPosInCameraSpace[1]}`);
        if (shipPosInCameraSpace[0] - radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + radius * camera.zoom < 0 || shipPosInCameraSpace[1] - radius * camera.zoom > camera.height || shipPosInCameraSpace[1] + radius * camera.zoom < 0) return;

        var states = ship.states;

        var ctx = camera.ctx;

        ctx.save();
        ctx.translate(shipPosInCameraSpace[0], shipPosInCameraSpace[1]); //translate to camera space position
        ctx.rotate((rotation - camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

        ctx.scale(camera.zoom, camera.zoom); //scale by zoom value

        //Thrusters
        var width = ship.model.thrusterPoints.width;
        //forward thrust
        for (var c = 0; c <= thrusterDetail; c++) {
          ctx.fillStyle = thrusterColor.shade(.5 * c).colorString;
          ctx.save();
          ctx.beginPath();

          //Medial Thrusters
          //forward
          var medial = ship.interpolateWiValue('medial', time);
          var trailLength = 40 * medial * (1 - c / (thrusterDetail + 1));

          if (medial > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.medial.positive.length; n++) {
              var tp = ship.model.thrusterPoints.medial.positive[n];
              ctx.moveTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
              ctx.lineTo(tp[0] - rightVector[0] * width / 2, tp[1] - rightVector[1] * width / 2);
              ctx.lineTo(tp[0] + upVector[0] * trailLength, tp[1] + upVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
            }
          }
          //backward
          else if (medial < 0) {
              for (var n = 0; n < ship.model.thrusterPoints.medial.positive.length; n++) {
                var tp = ship.model.thrusterPoints.medial.negative[n];
                ctx.moveTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
                ctx.lineTo(tp[0] - rightVector[0] * width / 2, tp[1] - rightVector[1] * width / 2);
                ctx.lineTo(tp[0] + upVector[0] * trailLength, tp[1] + upVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
                ctx.lineTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
              }
            }

          //rotational thrusters  
          var rotational = ship.interpolateWiValue('rotational', time);
          trailLength = 40 * rotational * (1 - c / (thrusterDetail + 1));
          //ccw
          if (rotational > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.rotational.positive.length; n++) {
              var tp = ship.model.thrusterPoints.rotational.positive[n];
              ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
              ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
            }
          }
          //cw
          else if (rotational < 0) {
              for (var n = 0; n < ship.model.thrusterPoints.rotational.negative.length; n++) {
                var tp = ship.model.thrusterPoints.rotational.negative[n];
                ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
                ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
                ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
                ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              }
            }

          //lateral thrusters
          var lateral = ship.interpolateWiValue('lateral', time);
          trailLength = 40 * lateral * (1 - c / (thrusterDetail + 1));
          //rightward
          if (lateral > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.lateral.positive.length; n++) {
              var tp = ship.model.thrusterPoints.lateral.positive[n];
              ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
              ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
            }
          }
          //leftward
          else if (lateral < 0) {
              for (var n = 0; n < ship.model.thrusterPoints.lateral.negative.length; n++) {
                var tp = ship.model.thrusterPoints.lateral.negative[n];
                ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
                ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
                ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
                ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              }
            }

          ctx.globalAlpha = (c + 1) / (this.thrusterDetail + 1);
          ctx.fill();
          ctx.restore();
        }

        //shields
        var shp = ship.interpolateWiValue('shp', time);
        var shc = ship.interpolateWiValue('shc', time);
        if (shp > 0) {
          var shieldCoeff = shc;
          ctx.save();
          ctx.fillStyle = 'dodgerblue';
          ctx.beginPath();
          for (var n = 0; n < ship.model.shieldVectors.length; n++) {
            var vert = ship.model.vertices[n];
            var vec = ship.model.shieldVectors[n];
            var shieldVert = [vert[0] + vec[0] * shieldCoeff, vert[1] + vec[1] * shieldCoeff];
            if (n == 0) ctx.moveTo(shieldVert[0], shieldVert[1]);else ctx.lineTo(shieldVert[0], shieldVert[1]);
          }
          ctx.globalAlpha = shp;
          ctx.fill();
          ctx.restore();
        }

        //the rest of the ship
        ctx.beginPath();
        ctx.moveTo(ship.model.vertices[0][0], ship.model.vertices[0][1]);
        for (var c = 1; c < ship.model.vertices.length; c++) {
          var vert = ship.model.vertices[c];
          ctx.lineTo(vert[0], vert[1]);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      },

      //draws all laser objects in the given array to the given camera
      drawHitscans: function drawHitscans(hitscans, camera, time) {
        var ctx = camera.ctx;
        for (var n = 0; n < hitscans.length; n++) {
          var hitscan = hitscans[n];
          if (!hitscan.isDrawable) continue;
          var startX = hitscan.interpolateWiValue('startX', time);
          var startY = hitscan.interpolateWiValue('startY', time);
          var endX = hitscan.interpolateWiValue('endX', time);
          var endY = hitscan.interpolateWiValue('endY', time);
          var power = hitscan.interpolateWiValue('power', time);
          var efficiency = hitscan.interpolateWiValue('efficiency', time);
          var start = camera.worldPointToCameraSpace(startX, startY);
          var end = camera.worldPointToCameraSpace(endX, endY);
          var angle = utilities.angleBetweenVectors(end[0] - start[0], end[1] - start[1], 1, 0);
          var rightVector = utilities.rotate(0, 0, 1, 0, angle + 90);
          var width = power && efficiency ? power / efficiency * camera.zoom : 0;
          if (width < .8) width = .8;
          for (var c = 0; c <= hitscanDetail; c++) {
            var coeff = 1 - c / (hitscanDetail + 1);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(start[0] + coeff * width * rightVector[0] / 2, start[1] + width * rightVector[1] / 2);
            ctx.lineTo(end[0], end[1]);
            ctx.lineTo(start[0] - coeff * width * rightVector[0] / 2, start[1] - width * rightVector[1] / 2);
            ctx.arc(start[0], start[1], coeff * width / 2, -(angle - 90) * (Math.PI / 180), (angle - 90) * (Math.PI / 180) - 90, false);
            ctx.fillStyle = hitscan.getMostRecentValue('color').shade(0 + c / (hitscanDetail + 1)).colorString;
            ctx.fill();
            ctx.restore();
          }
        }
      },

      //draws all projectile objects in the given array to the given camera
      drawProjectiles: function drawProjectiles(projectiles, camera, dt, time) {
        var ctx = camera.ctx;
        for (var c = 0; c < projectiles.length; c++) {
          var prj = projectiles[c];
          var ageSeconds = (time - worldInfo.interpDelay - prj.arrivalTime) / 1000;
          var velX = prj.velocityX;
          var velY = prj.velocityY;
          var x = prj.x + ageSeconds * velX;
          var y = prj.y + ageSeconds * velY;
          var start = camera.worldPointToCameraSpace(x, y);
          var end = camera.worldPointToCameraSpace(x - velX * dt, y - velY * dt);
          var radius = prj.radius;

          if (ageSeconds < 0 || start[0] > camera.width + radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius) continue;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.strokeStyle = prj.color.colorString;
          var width = radius * camera.zoom;
          ctx.lineWidth = width > 1 ? width : 1;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
      },

      drawRadials: function drawRadials(radials, camera, dt, time) {
        var ctx = camera.ctx;
        for (var c = 0; c < radials.length; c++) {
          var radial = radials[c];
          if (!radial.isDrawable) continue;
          var x = radial.interpolateWiValue('x', time);
          var y = radial.interpolateWiValue('y', time);
          var velocity = radial.interpolateWiValue('velocity', time);
          var radius = radial.interpolateWiValue('radius', time);
          var center = camera.worldPointToCameraSpace(x, y);
          var frameVelocity = velocity * dt;

          if (center[0] > camera.width + radius + frameVelocity || center[0] < 0 - radius - frameVelocity || center[1] > camera.height + radius + frameVelocity || center[1] < 0 - radius - frameVelocity) return;

          ctx.save();
          ctx.beginPath();
          ctx.arc(center[0], center[1], (radius + frameVelocity / 2) * camera.zoom, 0, Math.PI * 2);
          ctx.strokeStyle = radial.getMostRecentValue('color').colorString;
          var width = frameVelocity * camera.zoom;
          ctx.lineWidth = width > .3 ? width : .1;
          ctx.stroke();
          ctx.restore();
        };
      },

      //draws the projected overlay for all asteroids in the given array to the given main and projected cameras
      drawAsteroidsOverlay: function drawAsteroidsOverlay(asteroids, camera, grid) {
        var start = [0, 0];
        var end = [camera.width, camera.height];
        var ctx = camera.ctx;
        var cameraPositions = [];
        var gridZoom = 1 / (grid.z + 1 / camera.zoom);
        if (grid) {
          ctx.save();
          ctx.beginPath();
          for (var c = 0; c < asteroids.length; c++) {
            var asteroid = asteroids[c];
            var gridPosition = camera.worldPointToCameraSpace(asteroid.x, asteroid.y, grid.z);
            if (gridPosition[0] + asteroid.radius * gridZoom < start[0] || gridPosition[0] - asteroid.radius * gridZoom > end[0] || gridPosition[1] + asteroid.radius * gridZoom < start[1] || gridPosition[1] - asteroid.radius * gridZoom > end[1]) continue;
            cameraPositions[c] = camera.worldPointToCameraSpace(asteroid.x, asteroid.y);
            ctx.moveTo(cameraPositions[c][0], cameraPositions[c][1]);
            ctx.lineTo(gridPosition[0], gridPosition[1]);
            ctx.moveTo(gridPosition[0], gridPosition[1]);
            //ctx.beginPath();
            ctx.arc(gridPosition[0], gridPosition[1], asteroid.radius * gridZoom, 0, Math.PI * 2);
          }
          ctx.strokeStyle = 'grey';
          ctx.lineWidth = .5;
          ctx.globalAlpha = .5;
          ctx.stroke();
          ctx.restore();
        }
      },

      //draws asteroids from the given asteroids array to the given camera
      drawAsteroids: function drawAsteroids(asteroids, colors, camera) {
        var start = [0, 0];
        var end = [camera.width, camera.height];
        var ctx = camera.ctx;
        for (var group = 0; group < colors.length; group++) {
          ctx.save();
          ctx.fillStyle = colors[group];
          ctx.beginPath();
          for (var c = 0; c < asteroids.length; c++) {
            var asteroid = asteroids[c];
            if (asteroid.colorIndex != group) continue;

            var zoom = 1 / (asteroid.z ? asteroid.z : 0 + 1 / camera.zoom);
            var finalPosition = camera.worldPointToCameraSpace(asteroid.x, asteroid.y, asteroid.z); //get asteroid's position in camera space

            if (finalPosition[0] + asteroid.radius * zoom < start[0] || finalPosition[0] - asteroid.radius * zoom > end[0] || finalPosition[1] + asteroid.radius * zoom < start[1] || finalPosition[1] - asteroid.radius * zoom > end[1]) continue;
            ctx.moveTo(finalPosition[0], finalPosition[1]);
            ctx.arc(finalPosition[0], finalPosition[1], asteroid.radius * zoom, 0, Math.PI * 2);
          };
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        };
      },

      //draws the heads-up display to the given camera
      drawHUD: function drawHUD(camera, time) {
        var hudInfo = worldInfo.getPlayerInfo();
        if (!hudInfo.isDrawable) return;
        var ctx = camera.ctx;
        ctx.save(); // NEW
        ctx.textAlign = 'center';
        ctx.textBaseline = 'center';
        ctx.fillStyle = 'black';
        ctx.fillRect(0, camera.height, camera.width, -30);
        utilities.fillText(ctx, hudInfo.current.stabilized ? 'assisted' : 'manual', camera.width / 2, camera.height - 10, "bold 12pt Orbitron", hudInfo.current.stabilized ? 'green' : 'red');
        ctx.textAlign = 'left';
        utilities.fillText(ctx, 'limiter', 10, camera.height - 10, "8pt Orbitron", 'white');
        if (hudInfo.current.clampEnabled) {
          var medial = hudInfo.interpolateWiValue('clampMedial', time);
          var lateral = hudInfo.interpolateWiValue('clampLateral', time);
          var rotational = hudInfo.interpolateWiValue('clampRotational', time);
          ctx.textAlign = 'right';
          utilities.fillText(ctx, Math.round(medial), 110, camera.height - 10, "10pt Orbitron", 'green');
          utilities.fillText(ctx, Math.round(lateral), 160, camera.height - 10, "10pt Orbitron", 'cyan');
          utilities.fillText(ctx, Math.round(rotational), 195, camera.height - 10, "10pt Orbitron", 'yellow');
        } else {
          ctx.textAlign = 'left';
          utilities.fillText(ctx, 'disabled', 110, camera.height - 10, "10pt Orbitron", 'red');
        }

        ctx.textAlign = 'right';
        var thrusterPower = hudInfo.interpolateWiValue('thrusterPower', time);
        var weaponPower = hudInfo.interpolateWiValue('weaponPower', time);
        var shieldPower = hudInfo.interpolateWiValue('shieldPower', time);
        utilities.fillText(ctx, 'T ' + Math.round(thrusterPower * 100) + '%', camera.width - 220, camera.height - 10, "10pt Orbitron", 'green');
        utilities.fillText(ctx, ' W ' + Math.round(weaponPower * 100) + '%', camera.width - 120, camera.height - 10, "10pt Orbitron", 'red');
        utilities.fillText(ctx, ' S ' + Math.round(shieldPower * 100) + '%', camera.width - 20, camera.height - 10, "10pt Orbitron", 'dodgerblue');

        ctx.restore(); // NEW
      },

      drawMultiLineText: function drawMultiLineText(camera, text, x, y, font) {
        var ctx = camera.ctx;
        ctx.font = font;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'white';
        var lineHeight = ctx.measureText("M").width * 1.2;
        var lines = text.split("\n");
        for (var i = lines.length - 1; i >= 0; --i) {
          ctx.fillText(lines[i], x, y);
          y += lineHeight;
        }
      },


      //draws the minimap to the given camera
      //note that the minimap camera has a viewport
      drawMinimap: function drawMinimap(camera, grid, time) {
        var ctx = camera.viewport.parent.ctx;
        var viewportStart = [camera.viewport.parent.width * camera.viewport.startX, camera.viewport.parent.height * camera.viewport.startY];
        var viewportEnd = [camera.viewport.parent.width * camera.viewport.endX, camera.viewport.parent.height * camera.viewport.endY];
        var viewportDimensions = [viewportEnd[0] - viewportStart[0], viewportEnd[1] - viewportStart[1]];
        ctx.save();
        ctx.translate(0, -30);
        ctx.beginPath();
        ctx.rect(viewportStart[0], viewportStart[1], viewportDimensions[0], viewportDimensions[1]);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.clip();
        ctx.translate(viewportStart[0] + viewportDimensions[0] / 2 - camera.width / 2, viewportStart[1] + viewportDimensions[1] / 2 - camera.height / 2);
        //ctx.translate(600,300);
        if (grid) drawing.drawGrid(camera, grid, true);
        drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
        for (var n = worldInfo.objs.length - 1; n >= 0; n--) {
          var ship = worldInfo.objs[n];
          var model = worldInfo.getModel(ship.id);
          if (model && ship.isDrawable) {
            ship.model = model;
            drawing.drawShipMinimap(ship, camera, time);
          }
        }
        ctx.restore();
      },

      drawTitleScreen: function drawTitleScreen(camera, osc, menu) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.globalAlpha = .5;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        var now = Date.now();
        var smallOffset = osc.getValue(now / 1000) * 6;
        var bigOffset = osc.getValue(now / 1000 - osc.period / 6) * 4;
        utilities.fillText(ctx, "Space Battle With Lasers", camera.width / 2, bigOffset + camera.height / 5, "bold 64pt Aroma", 'blue', .5);
        utilities.fillText(ctx, "SPACE BATTLE WITH LASERS", camera.width / 2, smallOffset + camera.height / 5, "bold 24pt Aroma", 'white');
        if (menu) {
          menu.draw(ctx, camera.width / 2, 4 * camera.height / 5, "24pt Orbitron", true);
        } else {
          utilities.fillText(ctx, "Press ENTER to start", camera.width / 2, 4 * camera.height / 5, "12pt Orbitron", 'white');
        }
        ctx.restore();
      },

      drawWinScreen: function drawWinScreen(camera) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.globalAlpha = .5;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        utilities.fillText(ctx, "You win!", camera.width / 2, camera.height / 5, "24pt Aroma", 'white');
        utilities.fillText(ctx, "Good for you. Press R to continue.", camera.width / 2, 4 * camera.height / 5, "12pt Orbitron", 'white');
        ctx.restore();
      },

      drawDisconnectScreen: function drawDisconnectScreen(camera) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.globalAlpha = .5;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        utilities.fillText(ctx, "Connection lost", camera.width / 2, 2 * camera.height / 5, "24pt Aroma", 'white');
        utilities.fillText(ctx, "Press ENTER to send another ship", camera.width / 2, 3 * camera.height / 5, "12pt Orbitron", 'white');
        ctx.restore();
      },

      drawEntryScreen: function drawEntryScreen(camera, entryPrompt, entry) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = "black", ctx.globalAlpha = .03;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        utilities.fillText(ctx, entryPrompt + ": " + entry, camera.width / 2, camera.height / 2 - 30, "24pt Aroma", 'white');
        ctx.restore();
      },

      //draw pause screen in the given camera
      drawChooseShipScreen: function drawChooseShipScreen(camera, entry) {
        var shipList = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

        var ctx = camera.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var list = "Options: ";
        for (var c = 0; c < shipList.length; c++) {
          if (c > 0) list += ', ';
          list += shipList[c];
        }
        utilities.fillText(ctx, list, camera.width / 2, camera.height / 2 + 30, "10pt Orbitron", 'white');
        ctx.restore();
      },

      //draws the "click me" graphic
      drawLockedGraphic: function drawLockedGraphic(camera) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        utilities.fillText(ctx, "Click me", camera.width / 2, camera.height / 2, "10pt Orbitron", 'white');
        ctx.restore();
      },

      drawTutorialGraphics: function drawTutorialGraphics(camera) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.textAlign = 'left';
        utilities.fillText(ctx, "WASD moves your ship", camera.width / 10, camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "LEFT and RIGHT arrow or mouse turns your ship", camera.width / 10, 2 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "UP and DOWN arrow or mouse-wheel zooms the camera", camera.width / 10, 3 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "SPACE or LEFT-CLICK fires your weapon", camera.width / 10, 4 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "SHIFT over-charges your thrusters", camera.width / 10, 5 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "ALT over-charges your shield", camera.width / 10, 6 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "RIGHT-CLICK over-charges your weapon", camera.width / 10, 7 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "C toggles the velocity limiter", camera.width / 10, 8 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "TAB switches between assisted and manual controls", camera.width / 10, 9 * camera.height / 11, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "Your goal is to destroy all enemy ships", camera.width / 10, 10 * camera.height / 11, "10pt Orbitron", 'white');
        //this.fill
        ctx.restore();
      }
    };

    module.exports = drawing;
  }, { "../server/utilities.js": 37, "./worldInfo.js": 24 }], 20: [function (require, module, exports) {
    var commands = require('../server/commands.js');
    var keys = require('../server/keys.js');

    var keymap = {
      KeyW: commands.FORWARD,
      KeyS: commands.BACKWARD,
      KeyA: commands.LEFT,
      KeyD: commands.RIGHT,
      ArrowRight: commands.CW,
      ArrowLeft: commands.CCW,
      ShiftLeft: commands.BOOST_THRUSTER,
      AltLeft: commands.BOOST_SHIELD,
      0: commands.FIRE,
      2: commands.BOOST_WEAPON,
      Tab: commands.TOGGLE_STABILIZER,
      KeyC: commands.TOGGLE_LIMITER,
      Space: commands.FIRE
    };

    module.exports = keymap;
  }, { "../server/commands.js": 33, "../server/keys.js": 35 }], 21: [function (require, module, exports) {
    var Client = require('./Client.js');

    window.onload = function () {
      new Client().frame();
    };
  }, { "./Client.js": 3 }], 22: [function (require, module, exports) {
    Object.prototype.optionalBind = function (prop) {
      if (this[prop]) this[prop] = this[prop].bind(this);
    };
  }, {}], 23: [function (require, module, exports) {
    module.exports = {
      getRequest: function getRequest(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
          callback(JSON.parse(xhr.response));
        };
        xhr.open('GET', url);
        xhr.setRequestHeader('Accept', "application/json");
        xhr.send();
        this.openRequests++;
      },
      postRequest: function postRequest(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onload = function () {
          callback(xhr.status);
        };
        xhr.send(JSON.stringify(data));
      }
    };
  }, {}], 24: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/client.js

    var utilities = require('../server/utilities.js');

    var STATE_BUFFER_LENGTH = 4;
    var BACKWARD_STATE_BUFFER_LENGTH = 3;

    var WorldInfo = function () {
      function WorldInfo() {
        _classCallCheck(this, WorldInfo);

        this.reset();
      }

      _createClass(WorldInfo, [{
        key: "reset",
        value: function reset() {
          this.objs = [];
          this.asteroids = [];
          this.asteroidColors = [];
          this.radials = [];
          this.prjs = [];
          this.hitscans = [];
          this.objInfos = {};
          this.objTracker = {};
          this.initialized = false;
          this.hasData = false;
          this.playerId = 0;
          this.wiInterval = 0;
          this.playerInfo = null;
          this.modelInfo = {};
          this.startTime = 0;
        }
      }, {
        key: "pushCollectionFromDataToWI",
        value: function pushCollectionFromDataToWI(dwi, type, now, stateIndex) {
          var dwiCollection = dwi[type] || [];
          for (var c = 0; c < dwiCollection.length; c++) {
            var obj = dwiCollection[c];
            this.objTracker[obj.id] = true;
            if (this.objInfos[obj.id]) {
              this.objInfos[obj.id].pushState(obj, stateIndex);
            } else {
              var newObjInfo = new ObjInfo(this, now, obj, stateIndex);
              this.objInfos[obj.id] = newObjInfo;
              this[type].push(newObjInfo);
            }
          }
          for (var _c = 0; _c < this[type].length; _c++) {
            var _obj = this[type][_c];
            if (!this.objTracker[_obj.id]) this.removeIndexFromWiCollection(_c, type);
          }
        }
      }, {
        key: "pushNonInterpCollectionFromDataToWI",
        value: function pushNonInterpCollectionFromDataToWI(dwi, type, now) {
          var created = dwi[type].created;
          for (var c = 0; c < created.length; c++) {
            var a = created[c];
            a.arrivalTime = now;
            this[type].push(a);
          }
          var destroyed = dwi[type].destroyed;
          for (var _c2 = 0; _c2 < this[type].length; _c2++) {
            var _a = this[type][_c2];
            for (var i = 0; i < destroyed.length; i++) {
              if (destroyed[i] === _a.id) this[type].splice(_c2--, 1);
            }
          }
        }
      }, {
        key: "prep",
        value: function prep() {
          this.objTracker = {};
        }
      }, {
        key: "pushWiInitData",
        value: function pushWiInitData(data) {
          this.wiInterval = data.interval;
          this.asteroidColors = data.asteroidColors;
          this.initialized = true;
        }
      }, {
        key: "pushWiData",
        value: function pushWiData(data) {
          var stateIndex = data.stateIndex;
          var now = Date.now().valueOf();

          if (this.startTime === 0) this.startTime = now;
          now = stateIndex * this.wiInterval + this.startTime;

          if (!this.playerInfo) this.playerInfo = new ObjInfo(this, now, data.playerInfo, stateIndex);else this.playerInfo.pushState(data.playerInfo, stateIndex);

          var dwi = data;
          this.prep();
          this.pushCollectionFromDataToWI(dwi, 'objs', now, stateIndex);
          this.pushNonInterpCollectionFromDataToWI(dwi, 'prjs', now);
          this.pushCollectionFromDataToWI(dwi, 'hitscans', now, stateIndex);
          this.pushCollectionFromDataToWI(dwi, 'radials', now, stateIndex);
          this.pushNonInterpCollectionFromDataToWI(dwi, 'asteroids', now);

          this.hasData = true;
        }
      }, {
        key: "addShips",
        value: function addShips(ships) {
          var _this13 = this;

          Object.keys(ships).forEach(function (id) {
            _this13.modelInfo[id] = ships[id];
          });
        }
      }, {
        key: "addShip",
        value: function addShip(shipInfo) {
          this.modelInfo[shipInfo.id] = shipInfo.model;
        }
      }, {
        key: "getPlayerInfo",
        value: function getPlayerInfo() {
          return this.playerInfo;
        }
      }, {
        key: "getModel",
        value: function getModel(id) {
          return this.modelInfo[id];
        }
      }, {
        key: "removeIndexFromWiCollection",
        value: function removeIndexFromWiCollection(index, type) {
          var collection = this[type];
          var obj = collection[index];
          delete this.objInfos[obj.id];
          collection.splice(index, 1);
        }
      }, {
        key: "interpDelay",
        get: function get() {
          return (STATE_BUFFER_LENGTH - 1) * this.wiInterval;
        }
      }]);

      return WorldInfo;
    }();

    var worldInfo = new WorldInfo();

    var ObjInfo = function () {
      function ObjInfo(worldInfo) {
        var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now();
        var initialState = arguments[2];
        var initialStateIndex = arguments[3];

        _classCallCheck(this, ObjInfo);

        this.worldInfo = worldInfo;
        this.states = [];
        this.stateIndices = [];
        this.stateCount = STATE_BUFFER_LENGTH + BACKWARD_STATE_BUFFER_LENGTH;
        this.creationTime = time;
        this.initialStateIndex = initialStateIndex;
        this.id = initialState.id;
        if (initialState) this.pushState(initialState, initialStateIndex);
      }

      _createClass(ObjInfo, [{
        key: "pushState",
        value: function pushState(obj, index) {
          this.states.push(obj);
          this.stateIndices.push(index - this.initialStateIndex);
          while (this.states.length > this.stateCount) {
            this.states.shift();
            this.stateIndices.shift();
          }
        }
      }, {
        key: "interpolateWiValue",
        value: function interpolateWiValue(val, time) {
          return this.interpolateValue(val, time, utilities.lerp);
        }
      }, {
        key: "interpolateRotationValue",
        value: function interpolateRotationValue(val, time) {
          return this.interpolateValue(val, time, utilities.rotationLerp);
        }
      }, {
        key: "interpolateValue",
        value: function interpolateValue(val, time, lerp) {
          var oldestStateIndex = this.stateIndices[0];
          var desiredStateIndex = (time - this.creationTime - this.worldInfo.interpDelay) / this.worldInfo.wiInterval;

          if (!this.worldInfo.wiInterval) return this.getMostRecentValue(val);

          var perc = desiredStateIndex - oldestStateIndex;
          if (perc < 0) return this.states[0][val];else if (perc < this.stateCount - 1) {
            return lerp(this.states[Math.floor(perc)][val], this.states[Math.ceil(perc)][val], perc - Math.floor(perc));
          } else {
            return this.states[this.stateCount - 1][val];
          }
        }
      }, {
        key: "getMostRecentValue",
        value: function getMostRecentValue(val) {
          return this.states[this.stateCount - 1][val];
        }
      }, {
        key: "isDrawable",
        get: function get() {
          return this.states.length === this.stateCount;
        }
      }, {
        key: "hasModel",
        get: function get() {
          return Boolean(this.worldInfo.getModel(this.id));
        }
      }, {
        key: "current",
        get: function get() {
          return this.states[this.stateCount - 1];
        }
      }]);

      return ObjInfo;
    }();

    module.exports = worldInfo;
  }, { "../server/utilities.js": 37 }], 25: [function (require, module, exports) {
    var _require = require('./serializationConstants.js'),
        primitiveByteSizes = _require.primitiveByteSizes,
        ARRAY_INDEX_TYPE = _require.ARRAY_INDEX_TYPE;

    var Deserializer = function () {
      function Deserializer(buf) {
        _classCallCheck(this, Deserializer);

        this.dataView = new DataView(buf);
        this.cursor = 0;
      }

      _createClass(Deserializer, [{
        key: "alignCursor",
        value: function alignCursor(alignment) {
          this.cursor += alignment - this.cursor % alignment;
        }

        // type should be an actual constructor object for non-primitives, not a string

      }, {
        key: "read",
        value: function read(Type) {
          var scaleFactor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

          var size = primitiveByteSizes[Type];
          var val = void 0;
          // Primitive
          if (size) {
            this.alignCursor(size);
            val = this.dataView["get" + Type](this.cursor) / scaleFactor;
            this.cursor += size;
          } else {
            // Object
            var serializableProperties = Type.serializableProperties;
            var opts = {};
            for (var c = 0; c < serializableProperties.length; c++) {
              var property = serializableProperties[c];
              if (property.isArray) {
                opts[property.key] = this.readArray(property.type, property.scaleFactor);
              } else {
                opts[property.key] = this.read(property.type, property.scaleFactor);
              }
            }
            val = new Type(opts);
          }

          return val;
        }
      }, {
        key: "readArray",
        value: function readArray(type) {
          var scaleFactor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

          var val = [];
          var length = this.read(ARRAY_INDEX_TYPE);
          for (var c = 0; c < length; c++) {
            val.push(this.read(type, scaleFactor));
          }
          return val;
        }
      }]);

      return Deserializer;
    }();

    module.exports = Deserializer;
  }, { "./serializationConstants.js": 36 }], 26: [function (require, module, exports) {
    var NetworkAsteroid = function NetworkAsteroid(asteroid) {
      _classCallCheck(this, NetworkAsteroid);

      this.id = asteroid.id;
      this.x = asteroid.x;
      this.y = asteroid.y;
      this.colorIndex = asteroid.colorIndex;
      this.radius = asteroid.radius;
    };

    NetworkAsteroid.serializableProperties = [{ key: 'id', type: 'Uint16' }, { key: 'x', type: 'Float32' }, { key: 'y', type: 'Float32' }, { key: 'colorIndex', type: 'Uint8' }, { key: 'radius', type: 'Uint16' }];

    module.exports = NetworkAsteroid;
  }, {}], 27: [function (require, module, exports) {
    var ColorHSL = require('./utilities.js').ColorHSL;

    var NetworkHitscan = function NetworkHitscan(hitscan) {
      _classCallCheck(this, NetworkHitscan);

      this.id = hitscan.id;
      this.startX = hitscan.startX;
      this.startY = hitscan.startY;
      this.endX = hitscan.endX;
      this.endY = hitscan.endY;
      this.color = hitscan.color;
      this.power = hitscan.power;
      this.efficiency = hitscan.efficiency;
    };

    NetworkHitscan.serializableProperties = [{ key: 'id', type: 'Uint16' }, { key: 'startX', type: 'Float32' }, { key: 'startY', type: 'Float32' }, { key: 'endX', type: 'Float32' }, { key: 'endY', type: 'Float32' }, { key: 'color', type: ColorHSL }, { key: 'power', type: 'Uint16' }, { key: 'efficiency', type: 'Uint16' }];

    module.exports = NetworkHitscan;
  }, { "./utilities.js": 37 }], 28: [function (require, module, exports) {
    var ColorHSL = require('./utilities.js').ColorHSL;

    var NetworkObj = function NetworkObj(obj) {
      _classCallCheck(this, NetworkObj);

      this.id = obj.id;
      this.x = obj.x;
      this.y = obj.y;
      this.rotation = obj.rotation;
      this.radius = obj.radius;
      this.shp = obj.shp;
      this.shc = obj.shc;
      this.hp = obj.hp;
      this.color = obj.color;
      this.medial = obj.medial;
      this.lateral = obj.lateral;
      this.rotational = obj.rotational;
      this.thrusterColor = obj.thrusterColor;
    };

    NetworkObj.serializableProperties = [{ key: 'id', type: 'Uint16' }, { key: 'x', type: 'Float32' }, { key: 'y', type: 'Float32' }, { key: 'rotation', type: 'Int16', scaleFactor: 50 }, { key: 'radius', type: 'Uint16' }, { key: 'shp', type: 'Uint16', scaleFactor: 100 }, { key: 'shc', type: 'Uint16', scaleFactor: 100 }, { key: 'hp', type: 'Uint16', scaleFactor: 100 }, { key: 'color', type: ColorHSL }, { key: 'medial', type: 'Int16', scaleFactor: 10 }, { key: 'lateral', type: 'Int16', scaleFactor: 10 }, { key: 'rotational', type: 'Int16', scaleFactor: 10 }, { key: 'thrusterColor', type: ColorHSL }];

    module.exports = NetworkObj;
  }, { "./utilities.js": 37 }], 29: [function (require, module, exports) {
    var NetworkPlayerObj = function NetworkPlayerObj(obj) {
      _classCallCheck(this, NetworkPlayerObj);

      this.x = obj.x;
      this.y = obj.y;
      this.velocityX = obj.velocityX;
      this.velocityY = obj.velocityY;
      this.rotation = obj.rotation;
      this.rotationalVelocity = obj.rotationalVelocity;
      this.clampMedial = obj.clampMedial;
      this.clampLateral = obj.clampLateral;
      this.clampRotational = obj.clampRotational;
      this.clampEnabled = obj.clampEnabled;
      this.stabilized = obj.stabilized;
      this.thrusterPower = obj.thrusterPower;
      this.weaponPower = obj.weaponPower;
      this.shieldPower = obj.shieldPower;
    };

    NetworkPlayerObj.serializableProperties = [{ key: 'x', type: 'Float32' }, { key: 'y', type: 'Float32' }, { key: 'velocityX', type: 'Float32' }, { key: 'velocityY', type: 'Float32' }, { key: 'rotation', type: 'Float32' }, { key: 'rotationalVelocity', type: 'Float32' }, { key: 'clampMedial', type: 'Uint16', scaleFactor: 10 }, { key: 'clampLateral', type: 'Uint16', scaleFactor: 10 }, { key: 'clampRotational', type: 'Uint16', scaleFactor: 10 }, { key: 'clampEnabled', type: 'Uint8' }, { key: 'stabilized', type: 'Uint8' }, { key: 'thrusterPower', type: 'Uint8', scaleFactor: 255 }, { key: 'weaponPower', type: 'Uint8', scaleFactor: 255 }, { key: 'shieldPower', type: 'Uint8', scaleFactor: 255 }];

    module.exports = NetworkPlayerObj;
  }, {}], 30: [function (require, module, exports) {
    var ColorRGB = require('./utilities.js').ColorRGB;

    var NetworkPrj = function NetworkPrj(prj) {
      _classCallCheck(this, NetworkPrj);

      this.id = prj.id;
      this.x = prj.x;
      this.y = prj.y;
      this.velocityX = prj.velocityX;
      this.velocityY = prj.velocityY;
      this.color = prj.color;
      this.radius = prj.radius;
    };

    NetworkPrj.serializableProperties = [{ key: 'id', type: 'Uint16' }, { key: 'x', type: 'Float32' }, { key: 'y', type: 'Float32' }, { key: 'velocityX', type: 'Float32' }, { key: 'velocityY', type: 'Float32' }, { key: 'color', type: ColorRGB }, { key: 'radius', type: 'Uint8' }];

    module.exports = NetworkPrj;
  }, { "./utilities.js": 37 }], 31: [function (require, module, exports) {
    var ColorRGB = require('./utilities.js').ColorRGB;

    var NetworkRadial = function NetworkRadial(radial) {
      _classCallCheck(this, NetworkRadial);

      this.id = radial.id;
      this.x = radial.x;
      this.y = radial.y;
      this.velocity = radial.velocity;
      this.radius = radial.radius;
      this.color = radial.color;
    };

    NetworkRadial.serializableProperties = [{ key: 'id', type: 'Uint16' }, { key: 'x', type: 'Float32' }, { key: 'y', type: 'Float32' }, { key: 'velocity', type: 'Float32' }, { key: 'radius', type: 'Uint16' }, { key: 'color', type: ColorRGB }];

    module.exports = NetworkRadial;
  }, { "./utilities.js": 37 }], 32: [function (require, module, exports) {
    var NetworkObj = require('./NetworkObj.js');
    var NetworkPlayerObj = require('./NetworkPlayerObj.js');
    var NetworkAsteroid = require('./NetworkAsteroid.js');
    var NetworkPrj = require('./NetworkPrj.js');
    var NetworkHitscan = require('./NetworkHitscan.js');
    var NetworkRadial = require('./NetworkRadial.js');

    var NetworkAsteroidInfo = function NetworkAsteroidInfo(_ref) {
      var created = _ref.created,
          destroyed = _ref.destroyed;

      _classCallCheck(this, NetworkAsteroidInfo);

      this.created = created;
      this.destroyed = destroyed;
    };

    NetworkAsteroidInfo.serializableProperties = [{ key: 'created', type: NetworkAsteroid, isArray: true }, { key: 'destroyed', type: 'Uint16', isArray: true }];

    var NetworkPrjInfo = function NetworkPrjInfo(_ref2) {
      var created = _ref2.created,
          destroyed = _ref2.destroyed;

      _classCallCheck(this, NetworkPrjInfo);

      this.created = created;
      this.destroyed = destroyed;
    };

    NetworkPrjInfo.serializableProperties = [{ key: 'created', type: NetworkPrj, isArray: true }, { key: 'destroyed', type: 'Uint16', isArray: true }];

    var NetworkWorldInfo = function NetworkWorldInfo(_ref3) {
      var stateIndex = _ref3.stateIndex,
          objs = _ref3.objs,
          asteroids = _ref3.asteroids,
          prjs = _ref3.prjs,
          hitscans = _ref3.hitscans,
          radials = _ref3.radials,
          playerInfo = _ref3.playerInfo;

      _classCallCheck(this, NetworkWorldInfo);

      this.stateIndex = stateIndex;
      this.objs = objs;
      this.asteroids = asteroids;
      this.prjs = prjs;
      this.hitscans = hitscans;
      this.radials = radials;
      this.playerInfo = playerInfo;
    };

    NetworkWorldInfo.serializableProperties = [{ key: 'stateIndex', type: 'Uint32' }, { key: 'objs', type: NetworkObj, isArray: true }, { key: 'asteroids', type: NetworkAsteroidInfo }, { key: 'prjs', type: NetworkPrjInfo }, { key: 'hitscans', type: NetworkHitscan, isArray: true }, { key: 'radials', type: NetworkRadial, isArray: true }, { key: 'playerInfo', type: NetworkPlayerObj }];

    module.exports = NetworkWorldInfo;
  }, { "./NetworkAsteroid.js": 26, "./NetworkHitscan.js": 27, "./NetworkObj.js": 28, "./NetworkPlayerObj.js": 29, "./NetworkPrj.js": 30, "./NetworkRadial.js": 31 }], 33: [function (require, module, exports) {
    var commandList = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'CW', 'CCW', 'FIRE', 'BOOST_THRUSTER', 'BOOST_SHIELD', 'BOOST_WEAPON', 'TOGGLE_STABILIZER', 'TOGGLE_LIMITER'];

    var commands = {};

    for (var c = 0; c < commandList.length; c++) {
      commands[commandList[c]] = c;
    }

    module.exports = commands;
  }, {}], 34: [function (require, module, exports) {
    var STATES = {
      STARTING: 2,
      ENABLED: 1,
      DISABLED: 0
    };

    var isStarting = function isStarting(stateVal) {
      return stateVal === STATES.STARTING;
    };

    var isEnabled = function isEnabled(stateVal) {
      return stateVal === STATES.ENABLED || isStarting(stateVal);
    };

    var isDisabled = function isDisabled(stateVal) {
      return stateVal === STATES.DISABLED;
    };

    var advanceState = function advanceState(stateVal) {
      if (stateVal === STATES.STARTING) {
        return STATES.ENABLED;
      }
      return stateVal;
    };

    var advanceStateDictionary = function asd() {
      var keys = Object.keys(this);
      for (var c = 0; c < keys.length; c++) {
        this[keys[c]] = advanceState(this[keys[c]]);
      }
    };

    module.exports = {
      STATES: STATES,
      isStarting: isStarting,
      isEnabled: isEnabled,
      isDisabled: isDisabled,
      advanceStateDictionary: advanceStateDictionary
    };
  }, {}], 35: [function (require, module, exports) {
    module.exports = Object.freeze({
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SPACE: 32,
      SHIFT: 16,
      ALT: 18,
      W: 87,
      A: 65,
      D: 68,
      S: 83,
      Q: 81,
      E: 69,
      TAB: 9,
      F: 70,
      R: 82,
      C: 67,
      P: 80,
      CTRL: 17,
      J: 74,
      K: 75,
      L: 76,
      ENTER: 13,
      LMB: 0,
      MMB: 1,
      RMB: 2
    });
  }, {}], 36: [function (require, module, exports) {
    var primitiveByteSizes = {
      Float32: 4,
      Uint8: 1,
      Uint16: 2,
      Uint32: 4,
      Int16: 2
    };

    var ARRAY_INDEX_TYPE = 'Uint32';

    module.exports = { primitiveByteSizes: primitiveByteSizes, ARRAY_INDEX_TYPE: ARRAY_INDEX_TYPE };
  }, {}], 37: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

    var has = Object.prototype.hasOwnProperty;

    var Capsule = function Capsule(x1, y1, x2, y2, r) {
      _classCallCheck(this, Capsule);

      this.center1 = [x1, y1];
      this.center2 = [x2, y2];
      this.radius = r;
    };

    var VelocityCapsule = function (_Capsule) {
      _inherits(VelocityCapsule, _Capsule);

      function VelocityCapsule(object, dt) {
        _classCallCheck(this, VelocityCapsule);

        return _possibleConstructorReturn(this, (VelocityCapsule.__proto__ || Object.getPrototypeOf(VelocityCapsule)).call(this, object.x, object.y, object.x + object.velocityX * dt, object.y + object.velocityY * dt, object.destructible.radius));
      }

      return VelocityCapsule;
    }(Capsule);

    var ColorRGB = function () {
      function ColorRGB(_ref4) {
        var r = _ref4.r,
            g = _ref4.g,
            b = _ref4.b;

        _classCallCheck(this, ColorRGB);

        this.r = r;
        this.g = g;
        this.b = b;
        this._generateColorString();
      }

      _createClass(ColorRGB, [{
        key: "_generateColorString",
        value: function _generateColorString() {
          this.colorString = "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        }
      }, {
        key: "shade",
        value: function shade(percent) {
          var t = percent < 0 ? 0 : 255;
          var p = percent < 0 ? percent * -1 : percent;
          var r = Math.round((t - this.r) * p) + this.r;
          var g = Math.round((t - this.g) * p) + this.g;
          var b = Math.round((t - this.b) * p) + this.b;
          return new ColorRGB({ r: r, g: g, b: b });
        }
      }]);

      return ColorRGB;
    }();

    ColorRGB.serializableProperties = [{ key: 'r', type: 'Uint8' }, { key: 'g', type: 'Uint8' }, { key: 'b', type: 'Uint8' }];

    var ColorHSL = function () {
      function ColorHSL(_ref5) {
        var h = _ref5.h,
            s = _ref5.s,
            l = _ref5.l;

        _classCallCheck(this, ColorHSL);

        this.h = h;
        this.s = s;
        this.l = l;
        this.colorString = "hsl(" + this.h + "," + this.s + "%," + this.l + "%)";
      }

      _createClass(ColorHSL, [{
        key: "shade",
        value: function shade(percent) {
          var t = percent < 0 ? 0 : 100;
          var p = percent < 0 ? percent * -1 : percent;
          var l = Math.round((t - this.l) * p) + this.l;
          return new ColorHSL({ h: this.h, s: this.s, l: l });
        }
      }]);

      return ColorHSL;
    }();

    ColorHSL.serializableProperties = [{ key: 'h', type: 'Uint16' }, { key: 's', type: 'Uint8' }, { key: 'l', type: 'Uint8' }];

    var utilities = {
      getForwardVector: function getForwardVector() {
        // console.log(this.rotation);
        if (!this.forwardVectorX || !this.forwardVectorY) {
          var normalizedForwardVector = utilities.rotate(0, 0, 0, -1, -this.rotation);
          this.forwardVectorX = normalizedForwardVector[0];
          this.forwardVectorY = normalizedForwardVector[1];
        }

        return [this.forwardVectorX, this.forwardVectorY];
      },
      getRightVector: function getRightVector() {
        if (!this.rightVectorX || !this.rightVectorY) {
          var normalizedRightVector = utilities.rotate(0, 0, 0, -1, -this.rotation + 90);
          this.rightVectorX = normalizedRightVector[0];
          this.rightVectorY = normalizedRightVector[1];
        }

        return [this.rightVectorX, this.rightVectorY];
      },
      getMedialVelocity: function getMedialVelocity() {
        if (!this.medialVelocity) {
          var forwardVector = utilities.getForwardVector.call(this);
          this.medialVelocity = -utilities.scalarComponentOf1InDirectionOf2(this.velocityX, this.velocityY, forwardVector[0], forwardVector[1]); // get magnitude of projection of velocity onto the forward vector
        }

        return this.medialVelocity;
      },
      getLateralVelocity: function getLateralVelocity() {
        if (!this.lateralVelocity) {
          var rightVector = utilities.getRightVector.call(this);
          this.lateralVelocity = -utilities.scalarComponentOf1InDirectionOf2(this.velocityX, this.velocityY, rightVector[0], rightVector[1]); // et magnitude of velocity's projection onto the right vector
        }
        return this.lateralVelocity;
      },

      fillText: function fillText(ctx, string, x, y, css, color, alpha) {
        ctx.save();
        // https://developer.mozilla.org/en-US/docs/Web/CSS/font
        ctx.font = css;
        ctx.fillStyle = color;
        if (alpha) {
          ctx.globalAlpha = alpha;
        }
        ctx.fillText(string, x, y);
        ctx.restore();
      },
      calculateDeltaTime: function calculateDeltaTime() {
        var now = Date.now().valueOf(); // get date as unix timestamp
        var fps = 1000 / (now - this.lastTime);
        this.lastTime = now;
        if (isNaN(fps)) {
          return 0;
        }
        return 1 / fps;
      },

      getRandom: function getRandom(min, max) {
        return Math.random() * (max - min) + min;
      },
      getRandomIntIncExc: function getRandomIntIncExc(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
      },
      getRandomIntInclusive: function getRandomIntInclusive(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      circlesIntersect: function circlesIntersect(c1, c2) {
        var dx = c2.x - c1.x;
        var dy = c2.y - c1.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
      },
      distanceSqrBetweenPoints: function distanceSqrBetweenPoints(x1, y1, x2, y2) {
        return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      },

      ColorRGB: ColorRGB,
      ColorHSL: ColorHSL,
      // Function Name: getRandomColor()
      // returns a random color of alpha 1.0
      // http://paulirish.com/2009/random-hex-color-code-snippets/
      getRandomColor: function getRandomColor() {
        var red = Math.round(Math.random() * 200 + 55);
        var green = Math.round(Math.random() * 200 + 55);
        var blue = Math.round(Math.random() * 200 + 55);
        var color = new ColorRGB({ r: red, g: green, b: blue });
        // OR if you want to change alpha
        // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
        return color;
      },
      getRandomBrightColor: function getRandomBrightColor() {
        var h = Math.round(Math.random() * 360);
        var color = new ColorHSL({ h: h, s: 100, l: 65 });
        // OR if you want to change alpha
        // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
        return color;
      },

      pointInsideCircle: function pointInsideCircle(x, y, I) {
        var dx = x - I.x;
        var dy = y - I.y;
        return dx * dx + dy * dy <= I.radius * I.radius;
      },

      getRandomUnitVector: function getRandomUnitVector() {
        var x = utilities.getRandom(-1, 1);
        var y = utilities.getRandom(-1, 1);
        var length = Math.sqrt(x * x + y * y);
        if (length === 0) {
          // very unlikely
          x = 1; // point right
          y = 0;
          length = 1;
        } else {
          x /= length;
          y /= length;
        }

        return { x: x, y: y };
      },

      // Translates an arbitrary orientation into the range of -180 to 180
      correctOrientation: function correctOrientation(orientation) {
        var or = orientation;
        while (or > 180) {
          or -= 360;
        }
        while (or < -180) {
          or += 360;
        }

        return or;
      },

      rotationLerp: function rotationLerp(from, to, percent) {
        if (Math.abs(to - from) > 180) {
          var adjustment = from > to ? -360 : 360;
          return utilities.correctOrientation(utilities.lerp(from + adjustment, to, percent));
        }
        return utilities.lerp(from, to, percent);
      },

      clamp: function clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
      },

      distanceSqr: function distanceSqr(p1, p2) {
        var vec = [p2[0] - p1[0], p2[1] - p1[1]];
        return vec[0] * vec[0] + vec[1] * vec[1];
      },

      // http://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
      // point to rotate around, point to rotate, angle to rotate by
      rotate: function rotate(cx, cy, x, y, angle) {
        var angleRadians = Math.PI / 180 * angle;
        return [Math.cos(angleRadians) * (x - cx) + Math.sin(angleRadians) * (y - cy) + cx, Math.cos(angleRadians) * (y - cy) - Math.sin(angleRadians) * (x - cx) + cy];
      },

      cross: function cross(p, q) {
        return p[0] * q[1] - p[1] * q[0];
      },


      dotProduct: function dotProduct(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
      },

      normalizeVector: function normalizeVector(x, y) {
        var magnitude = Math.sqrt(x * x + y * y);
        return [x / magnitude, y / magnitude];
      },

      vectorMagnitudeSqr: function vectorMagnitudeSqr(x, y) {
        return x * x + y * y;
      },

      // broken
      componentOf1InDirectionOf2: function componentOf1InDirectionOf2(x1, y1, x2, y2) {
        if (x1 === 0 && y1 === 0 || x2 === 0 && y2 === 0) {
          return [0, 0];
        }
        var dot = x1 * x2 + y1 * y2;
        var scalar = dot * dot / (x2 * x2 + y2 * y2);
        return [scalar * x1, scalar * y1];
      },

      // projects vector 1 onto vector 2 and returns the magnitude of the projection
      scalarComponentOf1InDirectionOf2: function scalarComponentOf1InDirectionOf2(x1, y1, x2, y2) {
        if (x1 === 0 && y1 === 0 || x2 === 0 && y2 === 0) {
          return 0;
        }
        // var dot = x1*x2+y1*y2;
        return (x1 * x2 + y1 * y2) / Math.sqrt(x2 * x2 + y2 * y2);
      },
      // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
      distanceFromPointToLine: function distanceFromPointToLine(x, y, x1, y1, x2, y2) {
        var A = x - x1;
        var B = y - y1;
        var C = x2 - x1;
        var D = y2 - y1;

        var dot = A * C + B * D;
        var lenSq = C * C + D * D;
        var param = -1;
        if (lenSq !== 0) {
          param = dot / lenSq;
        }

        var xx = void 0;
        var yy = void 0;

        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }

        var dx = x - xx;
        var dy = y - yy;
        return [Math.sqrt(dx * dx + dy * dy), param];
      },

      raySphereIntersect: function raySphereIntersect(s, e, c, r) {
        var l = [c[0] - s[0], c[1] - s[1]];
        var startToEnd = [e[0] - s[0], e[1] - s[1]];
        var magnitud = Math.sqrt(startToEnd[0] * startToEnd[0] + startToEnd[1] * startToEnd[1]);
        var direction = [startToEnd[0] / magnitud, startToEnd[1] / magnitud];
        var tca = l[0] * direction[0] + l[1] * direction[1];
        if (tca < 0) {
          return false;
        }
        var d = Math.sqrt(l[0] * l[0] + l[1] * l[1] - tca * tca);
        if (d < 0) {
          return false;
        }
        var thc = Math.sqrt(r * r - d * d);
        return tca - thc;
      },

      Capsule: Capsule,

      VelocityCapsule: VelocityCapsule,

      isCapsuleWithinCircle: function isCapsuleWithinCircle(circle, capsule) {
        var capsuleAxis = [capsule.center2[0] - capsule.center1[0], capsule.center2[1] - capsule.center1[1]];
        if (!(capsuleAxis[0] === 0 && capsuleAxis[1] === 0)) {
          capsuleAxis = utilities.normalizeVector(capsuleAxis[0], capsuleAxis[1]);
        }

        var pushedCenter1 = [capsule.center1[0] - capsuleAxis[0] * capsule.radius, capsule.center1[1] - capsuleAxis[1] * capsule.radius];
        var toCircleCenter = [circle.center[0] - pushedCenter1[0], circle.center[1] - pushedCenter1[1]];

        if (toCircleCenter[0] * toCircleCenter[0] + toCircleCenter[1] * toCircleCenter[1] > circle.radius * circle.radius) {
          return false;
        }

        var pushedCenter2 = [capsule.center2[0] - capsuleAxis[0] * capsule.radius, capsule.center2[1] - capsuleAxis[1] * capsule.radius];
        toCircleCenter = [circle.center[0] - pushedCenter2[0], circle.center[1] - pushedCenter2[1]];
        if (toCircleCenter[0] * toCircleCenter[0] + toCircleCenter[1] * toCircleCenter[1] > circle.radius * circle.radius) {
          return false;
        }

        return true;
      },

      circleCapsuleSAT: function circleCapsuleSAT(circle, capsule) {
        var axisCheck = utilities.circleCapsuleAxisCheck;

        // check first capsule's center axis
        var capsuleAxis = [capsule.center2[0] - capsule.center1[0], capsule.center2[1] - capsule.center1[1]];
        if (!axisCheck(circle, capsule, capsuleAxis)) {
          return false;
        }

        // check first capsule's normal axis
        var capsuleNormal = [-capsuleAxis[1], capsuleAxis[0]];
        if (!axisCheck(circle, capsule, capsuleNormal)) {
          return false;
        }

        var circleAxis1 = [capsule.center1[0] - circle.center[0], capsule.center1[1] - circle.center[1]];
        if (!axisCheck(circle, capsule, circleAxis1)) {
          return false;
        }

        var circleAxis2 = [capsule.center2[0] - circle.center[0], capsule.center2[1] - circle.center[1]];
        if (!axisCheck(circle, capsule, circleAxis2)) {
          return false;
        }

        return true;
      },

      circleCapsuleAxisCheck: function circleCapsuleAxisCheck(circle, capsule, axis) {
        var normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
        var maxCapsule = void 0;
        var minCapsule = void 0;

        var dotProductLeft = circle.center[0] * normalizedAxis[0];
        var dotProductRight = circle.center[1] * normalizedAxis[1];
        var projectedCenter = dotProductLeft + dotProductRight;
        var maxCircle = projectedCenter + circle.radius;
        var minCircle = projectedCenter - circle.radius;

        var projectedCenters = [capsule.center1[0] * normalizedAxis[0] + capsule.center1[1] * normalizedAxis[1], capsule.center2[0] * normalizedAxis[0] + capsule.center2[1] * normalizedAxis[1]];
        // find min and max
        if (projectedCenters[0] > projectedCenters[1]) {
          maxCapsule = projectedCenters[0];
          minCapsule = projectedCenters[1];
        } else {
          maxCapsule = projectedCenters[1];
          minCapsule = projectedCenters[0];
        }
        // add radius, because capsule
        maxCapsule += capsule.radius;
        minCapsule -= capsule.radius;

        // return whether they overlap
        return !(maxCapsule < minCircle || maxCircle < minCapsule);
      },

      polygonCapsuleSAT: function polygonCapsuleSAT(polygon, capsule) {
        var axisCheck = utilities.polygonCapsuleAxisCheck;

        // loop through polygon verts and do axis checks
        for (var i = 0; i < polygon.length; i++) {
          var nextPoint = i === polygon.length - 1 ? polygon[0] : polygon[i + 1];
          // normal to axis between current point and next point
          var normalAxis = [-(nextPoint[1] - polygon[i][1]), nextPoint[0] - polygon[i][0]];
          // axis between current point and capsule center1
          var centerAxis1 = [capsule.center1[0] - polygon[i][0], capsule.center1[1] - polygon[i][1]];
          // axis between current point and capsule center2
          var centerAxis2 = [capsule.center2[0] - polygon[i][0], capsule.center2[1] - polygon[i][1]];
          if (!axisCheck(polygon, capsule, centerAxis1) || !axisCheck(polygon, capsule, centerAxis2)) {
            return false;
          } else if (normalAxis !== [0, 0] && !axisCheck(polygon, capsule, normalAxis)) {
            return false;
          }
        }

        // get axis between centers, and the normal to that axis
        var capsuleAxisNormal = [-(capsule.center2[1] - capsule.center1[1]), capsule.center2[0] - capsule.center1[0]];
        var capsuleAxis = [capsule.center2[0] - capsule.center1[0], capsule.center2[1] - capsule.center1[1]];
        // check those as well
        if (!axisCheck(polygon, capsule, capsuleAxisNormal) || !axisCheck(polygon, capsule, capsuleAxis)) {
          return false;
        }

        // if we made it this far there are no separating axes
        return true;
      },

      polygonCapsuleAxisCheck: function polygonCapsuleAxisCheck(vertices, capsule, axis) {
        var normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
        var max1 = void 0;
        var min1 = void 0;
        var maxCapsule = void 0;
        var minCapsule = void 0;
        // loop through verts. project onto the axis and find the min/max
        for (var c = 0; c < vertices.length; c++) {
          var vert = vertices[c];
          var projectedVert = vert[0] * normalizedAxis[0] + vert[1] * normalizedAxis[1];
          if (c === 0 || projectedVert > max1) {
            max1 = projectedVert;
          }
          if (c === 0 || projectedVert < min1) {
            min1 = projectedVert;
          }
        }
        // project capsule centers onto the axis
        var projectedCenters = [capsule.center1[0] * normalizedAxis[0] + capsule.center1[1] * normalizedAxis[1], capsule.center2[0] * normalizedAxis[0] + capsule.center2[1] * normalizedAxis[1]];
        // find min and max
        if (projectedCenters[0] > projectedCenters[1]) {
          maxCapsule = projectedCenters[0];
          minCapsule = projectedCenters[1];
        } else {
          maxCapsule = projectedCenters[1];
          minCapsule = projectedCenters[0];
        }
        // it's a capsule, so add radius
        maxCapsule += capsule.radius;
        minCapsule -= capsule.radius;

        // return bool indicating whether they overlap
        return !(max1 < minCapsule || maxCapsule < min1);
      },

      capsuleCapsuleSAT: function capsuleCapsuleSAT(capsule1, capsule2) {
        var axisCheck = utilities.capsuleCapsuleAxisCheck;

        // check first capsule's center axis
        var capsule1Axis = [capsule1.center2[0] - capsule1.center1[0], capsule1.center2[1] - capsule1.center1[1]];
        if (!axisCheck(capsule1, capsule2, capsule1Axis)) {
          return false;
        }

        // check first capsule's normal axis
        var capsule1Normal = [-capsule1Axis[1], capsule1Axis[0]];
        if (!axisCheck(capsule1, capsule2, capsule1Normal)) {
          return false;
        }

        // same for second capsule
        var capsule2Axis = [capsule2.center2[0] - capsule2.center1[0], capsule2.center2[1] - capsule2.center1[1]];
        if (!axisCheck(capsule1, capsule2, capsule2Axis)) {
          return false;
        }

        var capsule2Normal = [-capsule2Axis[1], capsule2Axis[0]];
        if (!axisCheck(capsule1, capsule2, capsule2Normal)) {
          return false;
        }

        return true;
      },

      capsuleCapsuleAxisCheck: function capsuleCapsuleAxisCheck(capsule1, capsule2, axis) {
        var normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
        var maxCapsule1 = void 0;
        var minCapsule1 = void 0;
        var maxCapsule2 = void 0;
        var minCapsule2 = void 0;

        // project capsule1's centers onto the axis
        var projectedCenters1 = [capsule1.center1[0] * normalizedAxis[0] + capsule1.center1[1] * normalizedAxis[1], capsule1.center2[0] * normalizedAxis[0] + capsule1.center2[1] * normalizedAxis[1]];
        // find min and max
        if (projectedCenters1[0] > projectedCenters1[1]) {
          maxCapsule1 = projectedCenters1[0];
          minCapsule1 = projectedCenters1[1];
        } else {
          maxCapsule1 = projectedCenters1[1];
          minCapsule1 = projectedCenters1[0];
        }
        // add radius, because capsule
        maxCapsule1 += capsule1.radius;
        minCapsule1 -= capsule1.radius;

        // do the same for capsule2
        var projectedCenters2 = [capsule2.center1[0] * normalizedAxis[0] + capsule2.center1[1] * normalizedAxis[1], capsule2.center2[0] * normalizedAxis[0] + capsule2.center2[1] * normalizedAxis[1]];
        if (projectedCenters2[0] > projectedCenters2[1]) {
          maxCapsule2 = projectedCenters2[0];
          minCapsule2 = projectedCenters2[1];
        } else {
          maxCapsule2 = projectedCenters2[1];
          minCapsule2 = projectedCenters2[0];
        }
        maxCapsule2 += capsule2.radius;
        minCapsule2 -= capsule2.radius;

        // return whether they overlap
        return !(maxCapsule1 < minCapsule2 || maxCapsule2 < minCapsule1);
      },

      // http://stackoverflow.com/questions/9614109/how-to-calculate-an-angle-from-points
      angle: function angle(cx, cy, ex, ey) {
        var dy = ey - cy;
        var dx = ex - cx;
        var theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        theta += 180;
        return theta;
      },

      // http://blog.lexique-du-net.com/index.php?post/Calculate-the-real-difference-between-two-angle
      // s-keeping-the-sign
      // Cutting the link in half because of the 100 character line limit in AirBnB's style guide. Fuc
      // k AirBnb and their stupid style guide.
      differenceBetweenAngles: function differenceBetweenAngles(firstAngle, secondAngle) {
        var difference = secondAngle - firstAngle;
        while (difference < -180) {
          difference += 180;
        }while (difference > 180) {
          difference -= 180;
        }return difference;
      },

      angleBetweenVectors: function angleBetweenVectors(x1, y1, x2, y2) {
        var angle = (Math.atan2(y2, x2) - Math.atan2(y1, x1)) * (180 / Math.PI);

        if (angle > 180) {
          angle -= 360;
        } else if (angle < -180) {
          angle += 360;
        }
        return angle;
      },

      lerp: function lerp(from, to, percent) {
        return from * (1.0 - percent) + to * percent;
      },

      lerp3d: function lerp3d(from, to, percent) {
        var x = from[0] * (1.0 - percent) + to[0] * percent;
        var y = from[1] * (1.0 - percent) + to[1] * percent;
        var z = from[2] * (1.0 - percent) + to[2] * percent;
        return [x, y, z];
      },

      lerpNd: function lerpNd(from, to, percent) {
        var f = !Array.isArray(from) ? [from] : from;
        var t = !Array.isArray(to) ? [to] : to;
        if (f.length !== t.length) {
          return f;
        }
        var returnVal = [];

        for (var c = 0; c < f.length; c++) {
          returnVal.push(f[c] * (1.0 - percent) + t[c] * percent);
        }

        return returnVal;
      },

      // recursively merge src onto this, shallowly merging properties named "specialProperties"
      deepObjectMerge: function deepObjectMerge(src) {
        var _this15 = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          // if the current attribute is an object in the source
          if (src[key] instanceof Object && !(src[key] instanceof Array)) {
            // if the current attribute isn't in the this, or isn't an object in the this
            if (!has.call(_this15, key) || !(_this15[key] instanceof Object && !(_this15[key] instanceof Array))) {
              // make it an empty object
              _this15[key] = {};
            }
            // then deep merge the two
            if (key === 'specialProperties') {
              if (!_this15[key]) {
                _this15[key] = {};
              }
              utilities.shallowObjectMerge.call(_this15[key], src[key]);
            } else {
              utilities.deepObjectMerge.call(_this15[key], src[key]);
            }
          } else {
            // if current attribute is an array in the source, give this a copy of it
            // this[key] = (Array.isArray(src[key])) ? src[key].slice() : src[key];

            // we'll worry about referencing bugs later
            _this15[key] = src[key];
          }
        });

        return this;
      },


      // deepObjectCopy(src) {
      //   const keys = Object.keys(src);
      //   const copy = {};
      //   for(let c = 0; c < keys.length; c++) {
      //     const key = keys[c];
      //   }
      // }

      // merge src onto this, ignoring properties that are objects or arrays
      veryShallowObjectMerge: function veryShallowObjectMerge(src) {
        var _this16 = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          if (key === 'specialProperties') {
            if (!has.call(_this16, key)) {
              _this16[key] = {};
            }
            utilities.shallowObjectMerge.call(_this16[key], src[key]);
            return;
          }
          // if the current attribute is an object in the source
          if (!(src[key] instanceof Object) || src[key] instanceof Array) {
            _this16[key] = src[key];
          }
        });

        return this;
      },


      // merge src onto this. objects and arrays are copied by reference
      shallowObjectMerge: function shallowObjectMerge(src) {
        var _this17 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          _this17[key] = src[key];
        });

        return this;
      },


      // copy src onto this, ignoring properties that aren't present in this
      // and properties that are objects or arrays
      veryShallowUnionOverwrite: function veryShallowUnionOverwrite(src) {
        var _this18 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          if (has.call(_this18, key) && !(src[key] instanceof Object || src[key] instanceof Array)) {
            _this18[key] = src[key];
          }
        });

        return this;
      },


      // copy src onto this recursively, ignoring properties that aren't present in this
      // To-do
      deepUnionOverwrite: function deepUnionOverwrite(src) {
        var _this19 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          if (!has.call(_this19, key)) return;
          if (src[key] instanceof Object) {
            utilities.deepUnionOverwrite.call(_this19[key], src[key]);
          } else {
            _this19[key] = src[key];
          }
        });

        return this;
      }
    };

    module.exports = utilities;
  }, {}] }, {}, [21]);
