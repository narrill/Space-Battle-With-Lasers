"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/client.js

    var utilities = require('../server/utilities.js');
    var drawing = require('./drawing.js');

    var GAME_STATES = {
      TITLE: 0,
      PLAYING: 1,
      DISCONNECTED: 2,
      CHOOSESHIP: 3,
      WAIT: 4
    };

    var clamp = function clamp(val, min, max) {
      return Math.min(Math.max(val, min), max);
    };

    // Translates an arbitrary orientation into the range of -180 to 180
    var correctOrientation = function correctOrientation(orientation) {
      while (orientation > 180) {
        orientation -= 360;
      }while (orientation < -180) {
        orientation += 360;
      }return orientation;
    };

    var lerp = function lerp(from, to, percent) {
      return from * (1.0 - percent) + to * percent;
    };

    var rotationLerp = function rotationLerp(from, to, percent) {
      if (Math.abs(to - from) > 180) {
        var adjustment = from > to ? -360 : 360;
        return correctOrientation(lerp(from + adjustment, to, percent));
      } else return lerp(from, to, percent);
    };

    var Viewport = function Viewport() {
      var objectParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, Viewport);

      this.startX = objectParams.startX ? objectParams.startX : 0;
      this.startY = objectParams.startY ? objectParams.startY : 0;
      this.endX = objectParams.endX ? objectParams.endX : 1;
      this.endY = objectParams.endY ? objectParams.endY : 1;
      this.parent = objectParams.parent;
    };

    var Camera = function () {
      function Camera(canvas) {
        var objectParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Camera);

        this.x = objectParams.x ? objectParams.x : 0;
        this.y = objectParams.y ? objectParams.y : 0;
        this.rotation = objectParams.rotation ? objectParams.rotation : 0;
        this.zoom = objectParams.zoom ? objectParams.zoom : 1;
        this.minZoom = objectParams.minZoom ? objectParams.minZoom : 0;
        this.maxZoom = objectParams.maxZoom ? objectParams.maxZoom : Number.MAX_VALUE;
        this.viewport = new Viewport(objectParams.viewport);

        this.ctx = canvas.getContext('2d');
      }

      _createClass(Camera, [{
        key: "worldPointToCameraSpace",
        value: function worldPointToCameraSpace(xw, yw) {
          var cameraToPointVector = [(xw - this.x) * this.zoom, (yw - this.y) * this.zoom];
          var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
          return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
        }
      }, {
        key: "width",
        get: function get() {
          return canvas.width;
        }
      }, {
        key: "height",
        get: function get() {
          return canvas.height;
        }
      }]);

      return Camera;
    }();

    var lastTime = 0;
    var accumulator = 0;
    var socket = void 0;
    var canvas = void 0;
    var context = void 0;
    var inputBox = void 0;
    var entry = void 0;
    var cameras = {};
    var state = void 0;
    var shipList = [];
    var worldInfoModule = require('./worldInfo.js');
    var worldInfo = worldInfoModule.worldInfo;
    var playerInfo = worldInfoModule.playerInfo;
    var lastPlayerInfo = worldInfoModule.lastPlayerInfo;
    var hudInfo = worldInfoModule.hudInfo;
    var interpolateWiValue = worldInfoModule.interpolateWiValue;
    var pushCollectionFromDataToWI = worldInfoModule.pushCollectionFromDataToWI;
    var removeIndexFromWiCollection = worldInfoModule.removeIndexFromWiCollection;
    var resetWi = worldInfoModule.resetWi;

    var stars = { // Container for the starfield background objects. Populated at run-time
      objs: [], // From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/main.js
      colors: ['white', 'yellow']
    };
    // Rendering information for the grid graphic
    var grid = { // From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/main.js
      gridLines: 500, //number of grid lines
      gridSpacing: 20, //pixels per grid unit
      gridStart: [-5000, -5000], //corner anchor in world coordinates
      colors: [{
        color: '#1111FF',
        interval: 1000
      }, {
        color: 'blue',
        interval: 200
      }, {
        color: 'mediumblue',
        interval: 50,
        minimap: true
      }, {
        color: 'darkblue',
        interval: 10
      }, {
        color: 'navyblue',
        interval: 2
      }]
    };

    // Populates the starfield background container
    // From an old project of mine - https://github.com/narrill/Space-Battle/blob/master/js/constructors.js
    var generateStarField = function generateStarField(stars) {
      var lower = -10000000;
      var upper = 10000000;
      var maxRadius = 8000;
      var minRadius = 2000;
      for (var c = 0; c < 500; c++) {
        var group = Math.floor(Math.random() * stars.colors.length);
        stars.objs.push({
          x: Math.random() * (upper - lower) + lower,
          y: Math.random() * (upper - lower) + lower,
          radius: Math.random() * (maxRadius - minRadius) + minRadius,
          colorIndex: group
        });
      }
    };

    var keys = require('../server/keys.js');
    var myKeys = keys.myKeys;
    myKeys.keydown = [];
    var myMouse = keys.myMouse;
    myMouse.mousedown = [];
    myMouse.direction = 0;
    myMouse.wheel = 0;
    myMouse.sensitivity = 0.04;

    var locked = false;
    var pointerInit = function pointerInit(c) {
      canvas = c;
      canvas.addEventListener("mouseup", requestLock);
      // Hook pointer lock state change events
      document.addEventListener('pointerlockchange', changeCallback, false);
      document.addEventListener('mozpointerlockchange', changeCallback, false);
      document.addEventListener('webkitpointerlockchange', changeCallback, false);
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
      canvas.onselectstart = function () {
        return false;
      };
    };

    window.addEventListener("keydown", function (e) {
      if (state == GAME_STATES.CHOOSESHIP) {
        if (e.keyCode == 8 && entry.length > 0) entry = entry.slice(0, -1);else if (e.keyCode != 13) entry += String.fromCharCode(e.keyCode);
      } else if (state === GAME_STATES.PLAYING) socket.emit('input', { keyCode: e.keyCode, pos: 1 });
      myKeys.keydown[e.keyCode] = true;
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener("keyup", function (e) {
      myKeys.keydown[e.keyCode] = false;
      if (state === GAME_STATES.PLAYING) socket.emit('input', { keyCode: e.keyCode, pos: 0 });
      e.preventDefault();
      e.stopPropagation();
    });

    var requestLock = function requestLock() {
      canvas.requestPointerLock();
    };

    var mouseDown = function mouseDown(e) {
      myMouse[e.button] = true;
      e.preventDefault();
      e.stopPropagation();
    };

    var mouseUp = function mouseUp(e) {
      myMouse[e.button] = false;
      e.preventDefault();
      e.stopPropagation();
    };

    var mouseWheel = function mouseWheel(e) {
      myMouse.wheel += e.wheelDelta;
      e.preventDefault();
      e.stopPropagation();
    };

    var changeCallback = function changeCallback() {
      if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas) {
        // Pointer was just locked
        // Enable the mousemove listener
        window.removeEventListener("mouseup", requestLock, false);
        window.addEventListener("mousedown", mouseDown, false);
        window.addEventListener("mouseup", mouseUp, false);
        window.addEventListener("mousewheel", mouseWheel, false);
        canvas.addEventListener("mousemove", moveCallback, false);
        canvas.addEventListener("drag", function () {}, false);
        canvas.onclick = undefined;
        locked = true;
      } else {
        // Pointer was just unlocked
        // Disable the mousemove listener
        window.removeEventListener("mousedown", mouseDown, false);
        window.removeEventListener("mouseup", mouseUp, false);
        window.removeEventListener("mousewheel", mouseWheel, false);
        document.addEventListener("mouseup", requestLock, false);
        canvas.removeEventListener("mousemove", moveCallback, false);
        canvas.removeEventListener("drag", function () {}, false);
        canvas.onclick = function () {
          canvas.requestPointerLock();
        };
        locked = false;
      }
    };
    var moveCallback = function moveCallback(e) {
      var movementX = e.movementX;
      var movementY = e.movementY;
      myMouse.direction += movementX;
    };
    var resetMouse = function resetMouse() {
      myMouse.wheel = 0;
      myMouse.direction = 0;
    };
    var resetWheel = function resetWheel() {
      myMouse.wheel = 0;
    };

    var resetDirection = function resetDirection() {
      myMouse.direction = 0;
    };

    // Moves the dependent camera to the location and orientation of the main 
    // camera, but with the given Z-offset to simulate depth
    var linkCameraWithOffset = function linkCameraWithOffset(mainCamera, dependentCamera, offset) {
      dependentCamera.x = mainCamera.x;
      dependentCamera.y = mainCamera.y;
      dependentCamera.rotation = mainCamera.rotation;
      var cameraDistance = 1 / mainCamera.zoom;
      dependentCamera.zoom = 1 / (cameraDistance + offset);
    };

    var update = function update(dt) {
      if ((state == GAME_STATES.TITLE || state == GAME_STATES.DISCONNECTED) && myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER]) {
        state = GAME_STATES.CHOOSESHIP;
        myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
        entry = "";
        //socket.send({requestShipList:true});
        //game.resetGame();
      } else if (state == GAME_STATES.CHOOSESHIP && myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER]) {
        state = GAME_STATES.WAIT;
        myKeys.keydown[myKeys.KEYBOARD.KEY_ENTER] = false;
        socket.emit('ship', entry);
      } else if (state == GAME_STATES.PLAYING) {
        //camera shenanigans
        //camera zoom controls
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && cameras.camera.zoom <= cameras.camera.maxZoom) cameras.camera.zoom *= 1 + (3 - 1) * dt;
        if (myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] && cameras.camera.zoom >= cameras.camera.minZoom) cameras.camera.zoom *= 1 + (.33 - 1) * dt;
        if (myMouse.wheel) cameras.camera.zoom *= 1 + myMouse.wheel / 500;
        if (cameras.camera.zoom > cameras.camera.maxZoom) cameras.camera.zoom = cameras.camera.maxZoom;else if (cameras.camera.zoom < cameras.camera.minZoom) cameras.camera.zoom = cameras.camera.minZoom;

        //drawing.clearCamera(cameras.starCamera);
        //game.clearCamera(cameras.minimapCamera);
        //console.log(myMouse.direction);
        socket.emit('input', { md: myMouse.direction * myMouse.sensitivity / dt });
        if (myMouse[myMouse.BUTTONS.LEFT] != null) {
          socket.emit('input', { mb: myMouse.BUTTONS.LEFT, pos: myMouse[myMouse.BUTTONS.LEFT] });
          myMouse[myMouse.BUTTONS.LEFT] = undefined;
        }
        if (myMouse[myMouse.BUTTONS.RIGHT] != null) {
          socket.emit('input', { mb: myMouse.BUTTONS.RIGHT, pos: myMouse[myMouse.BUTTONS.RIGHT] });
          myMouse[myMouse.BUTTONS.RIGHT] = undefined;
        }
        resetMouse();
      }
    };

    //renders everything
    var draw = function draw(cameras, dt) {

      //clear cameras
      drawing.clearCamera(cameras.camera);

      cameras.camera.x = utilities.lerp(cameras.camera.x, playerInfo.x + playerInfo.velX / 10, 12 * dt);
      cameras.camera.y = utilities.lerp(cameras.camera.y, playerInfo.y + playerInfo.velY / 10, 12 * dt);

      var rotDiff = playerInfo.rotation + playerInfo.rotationalVelocity / 10 - cameras.camera.rotation;
      if (rotDiff > 180) rotDiff -= 360;else if (rotDiff < -180) rotDiff += 360;
      cameras.camera.rotation += utilities.lerp(0, rotDiff, 12 * dt);
      //cameras.camera.rotation+=rotDiff;
      if (cameras.camera.rotation > 180) cameras.camera.rotation -= 360;else if (cameras.camera.rotation < -180) cameras.camera.rotation += 360;
      cameras.starCamera.x = cameras.camera.x;
      cameras.starCamera.y = cameras.camera.y;
      cameras.starCamera.rotation = cameras.camera.rotation;
      cameras.gridCamera.x = cameras.camera.x;
      cameras.gridCamera.y = cameras.camera.y;
      cameras.gridCamera.rotation = cameras.camera.rotation;
      var cameraDistance = 1 / cameras.camera.zoom;
      cameras.starCamera.zoom = 1 / (cameraDistance + 10000);
      cameras.gridCamera.zoom = 1 / (cameraDistance + 5);
      cameras.minimapCamera.x = cameras.camera.x;
      cameras.minimapCamera.y = cameras.camera.y;
      cameras.minimapCamera.rotation = cameras.camera.rotation;

      //draw grids then asteroids then ships
      //if(drawStarField)
      drawing.drawAsteroids(stars, cameras.starCamera);

      if (state == GAME_STATES.PLAYING) {
        if (grid) drawing.drawGrid(cameras.gridCamera, grid);
        drawing.drawAsteroidsOverlay(worldInfo.asteroids, cameras.camera, cameras.gridCamera);
        for (var n = 0; n < worldInfo.objs.length; n++) {
          var ship = worldInfo.objs[n];
          if (!worldInfo.drawing[ship.id]) continue;
          if (!worldInfo.targets[ship.id]) {
            //removeIndexFromWiCollection(n,worldInfo.objs);
            //n--;
            continue;
          }
          drawing.drawShipOverlay(ship, cameras.camera, cameras.gridCamera);
        }
        drawing.drawProjectiles(worldInfo.prjs, cameras.camera, dt);
        drawing.drawHitscans(worldInfo.hitscans, cameras.camera);
        for (var c = 0; c < worldInfo.objs.length; c++) {
          var ship = worldInfo.objs[c];
          if (!worldInfo.drawing[ship.id]) continue;
          if (!worldInfo.targets[ship.id]) {
            removeIndexFromWiCollection(c, worldInfo.objs);
            c--;
            continue;
          }
          drawing.drawShip(ship, cameras.camera);
        }
        drawing.drawRadials(worldInfo.radials, cameras.camera, dt);
        drawing.drawAsteroids(worldInfo.asteroids, cameras.camera, cameras.gridCamera);
        drawing.drawHUD(cameras.camera);
        drawing.drawMinimap(cameras.minimapCamera, grid);
        utilities.fillText(cameras.camera.ctx, 'prjs: ' + worldInfo.prjs.length, 15, 30, "8pt Orbitron", 'white');
      } else if (state == GAME_STATES.TITLE) {
        //drawing.drawAsteroids(game.asteroids,cameras.camera,cameras.gridCamera);
        drawing.drawTitleScreen(cameras.camera);
      } else if (state == GAME_STATES.DISCONNECTED) drawing.drawDisconnectScreen(cameras.camera);else if (state == GAME_STATES.CHOOSESHIP) drawing.drawChooseShipScreen(cameras.camera, entry, shipList);

      if (!locked) drawing.drawLockedGraphic(cameras.camera);

      //resetMouse();

      utilities.fillText(cameras.camera.ctx, 'fps: ' + Math.floor(1 / dt), 15, 15, "8pt Orbitron", 'white');
    };

    var frame = function frame() {
      var now = Date.now().valueOf();
      var dt = (now - lastTime) / 1000;

      lastTime = Date.now().valueOf();
      draw(cameras, dt);

      var step = .004;
      if (dt > step * 8) {
        dt = step;
        console.log('throttle');
      }
      accumulator += dt;
      while (accumulator >= step) {
        update(step);
        accumulator -= step;
      }

      requestAnimationFrame(frame);
    };

    var init = function init() {
      socket = io.connect();

      socket.on('shipList', function (data) {
        shipList = data;
      });

      socket.on('destroyed', function () {
        state = GAME_STATES.DISCONNECTED;
      });

      socket.on('grid', function (data) {
        resetWi();
        worldInfoModule.setLastWorldUpdate(Date.now().valueOf());
        grid = data;
      });

      socket.on('destroyed', function () {
        state = GAME_STATES.DISCONNECTED;
      });

      socket.on('worldInfo', function (data) {
        if (state === GAME_STATES.WAIT) state = GAME_STATES.PLAYING;
        if (data.interval) worldInfoModule.setWiInterval(data.interval);
        lastPlayerInfo.x = playerInfo.x;
        playerInfo.x = data.x;
        lastPlayerInfo.y = playerInfo.y;
        playerInfo.y = data.y;
        lastPlayerInfo.rotation = playerInfo.rotation;
        playerInfo.rotation = data.rotation;
        lastPlayerInfo.velX = playerInfo.velX;
        playerInfo.velX = data.velX;
        lastPlayerInfo.velY = playerInfo.velY;
        playerInfo.velY = data.velY;
        lastPlayerInfo.rotationalVelocity = playerInfo.rotationalVelocity;
        playerInfo.rotationalVelocity = data.rotationalVelocity;
        hudInfo.velocityClamps = data.velocityClamps;
        hudInfo.stabilized = data.stabilized;
        hudInfo.powerDistribution = data.powerDistribution;

        for (var id in worldInfo.targets) {
          worldInfo.previousTargets[id] = worldInfo.targets[id];
        }worldInfo.targets = {};
        var now = Date.now().valueOf();
        worldInfoModule.setLastWorldUpdate(now);
        //console.log('last: '+lastWorldUpdate+'\nnow: '+nextWorldUpdate+'\nnext: '+nextWorldUpdate);
        pushCollectionFromDataToWI(data.worldInfo, 'objs');
        pushCollectionFromDataToWI(data.worldInfo, 'prjs');
        pushCollectionFromDataToWI(data.worldInfo, 'hitscans');
        pushCollectionFromDataToWI(data.worldInfo, 'radials');
        worldInfo.asteroids = data.worldInfo.asteroids;
      });

      canvas = document.querySelector('#mainCanvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
      context = canvas.getContext('2d');

      inputBox = document.querySelector("#inputBox");

      inputBox = document.querySelector("#inputBox");

      cameras.camera = new Camera(canvas);
      cameras.starCamera = new Camera(canvas);
      cameras.gridCamera = new Camera(canvas);
      cameras.minimapCamera = new Camera(canvas, {
        zoom: .001,
        viewport: {
          startX: .83,
          startY: .7,
          endX: 1,
          endY: 1,
          parent: cameras.camera
        }
      });

      generateStarField(stars);
      pointerInit(canvas);
      state = GAME_STATES.TITLE;
      requestAnimationFrame(frame);
    };

    window.onload = init;
  }, { "../server/keys.js": 4, "../server/utilities.js": 5, "./drawing.js": 2, "./worldInfo.js": 3 }], 2: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

    var utilities = require('../server/utilities.js');
    var worldInfoModule = require('./worldInfo.js');
    var worldInfo = worldInfoModule.worldInfo;
    var playerInfo = worldInfoModule.playerInfo;
    var lastPlayerInfo = worldInfoModule.lastPlayerInfo;
    var hudInfo = worldInfoModule.hudInfo;
    var interpolateWiValue = worldInfoModule.interpolateWiValue;
    var removeIndexFromWiCollection = worldInfoModule.removeIndexFromWiCollection;

    var thrusterDetail = 3;
    var hitscanDetail = 3;

    var upVector = [0, 1];
    var downVector = [0, -1];
    var rightVector = [1, 0];
    var leftVector = [-1, 0];

    var shadeRGBColor = function shadeRGBColor(color, percent) {
      var f = color.split(","),
          t = percent < 0 ? 0 : 255,
          p = percent < 0 ? percent * -1 : percent,
          R = parseInt(f[0].slice(4)),
          G = parseInt(f[1]),
          B = parseInt(f[2]);
      return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
    };

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
            start = camera.worldPointToCameraSpace(start[0], start[1]);
            end = camera.worldPointToCameraSpace(end[0], end[1]);
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
            _start = camera.worldPointToCameraSpace(_start[0], _start[1]);
            _end = camera.worldPointToCameraSpace(_end[0], _end[1]);
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
      drawShipOverlay: function drawShipOverlay(ship, camera, gridCamera) {
        var ctx = camera.ctx;
        interpolateWiValue(ship, 'x');
        interpolateWiValue(ship, 'y');
        interpolateWiValue(ship, 'rotation');
        var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x, ship.y); //get ship's position in camera space
        var shipPosInGridCameraSpace = gridCamera.worldPointToCameraSpace(ship.x, ship.y);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shipPosInCameraSpace[0], shipPosInCameraSpace[1]);
        ctx.lineTo(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.rotate((ship.rotation - gridCamera.rotation) * (Math.PI / 180));
        for (var type in ship.model.overlay.ranges) {
          ctx.arc(0, 0, ship.model.overlay.ranges[type] * gridCamera.zoom, -Math.PI / 2, Math.PI * 2 - Math.PI / 2);
        }
        ctx.rotate(-(ship.rotation - gridCamera.rotation) * (Math.PI / 180));
        ctx.translate(-shipPosInGridCameraSpace[0], -shipPosInGridCameraSpace[1]);
        ctx.lineWidth = .5;
        ctx.strokeStyle = 'grey';
        ctx.globalAlpha = .2;
        ctx.stroke();

        ctx.globalAlpha = .5;
        ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
        ctx.scale(gridCamera.zoom, gridCamera.zoom);
        if (ship.model.overlay.destructible) {
          ctx.beginPath();
          ctx.arc(0, 0, 750, -Math.PI / 2, -Math.PI * 2 * ship.shp - Math.PI / 2, true);
          ctx.strokeStyle = 'dodgerblue';
          ctx.lineWidth = 100;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 600, -Math.PI / 2, -Math.PI * 2 * interpolateWiValue(ship, 'hp') - Math.PI / 2, true);
          ctx.strokeStyle = 'green';
          ctx.stroke();
        }
        if (ship.model.overlay.colorCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, 300, 0, Math.PI * 2);
          ctx.fillStyle = ship.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, ship.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'black';
          ctx.globalAlpha = 1;
          ctx.fill();
        } else {
          ctx.scale(1 / gridCamera.zoom, 1 / gridCamera.zoom);
          ctx.beginPath();
          ctx.moveTo(ship.radius * gridCamera.zoom, 0);
          ctx.arc(0, 0, ship.radius * gridCamera.zoom, 0, Math.PI * 2);
          ctx.globalAlpha = .2;
          ctx.lineWidth = .5;
          ctx.strokeStyle = 'grey';
          ctx.stroke();
        }
        ctx.restore();
      },

      //draws the give ship's minimap representation to the given camera
      drawShipMinimap: function drawShipMinimap(ship, camera) {
        var ctx = camera.ctx;
        ctx.save();
        var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x, ship.y); //get ship's position in camera space
        ctx.translate(shipPosInCameraSpace[0], shipPosInCameraSpace[1]); //translate to camera space position
        ctx.rotate((ship.rotation - camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

        ctx.scale(.5, .5); //scale by zoom value

        //ctx.translate(0,7);
        ctx.beginPath();
        ctx.moveTo(ship.model.vertices[0][0], ship.model.vertices[0][1]);
        for (var c = 1; c < ship.model.vertices.length; c++) {
          var vert = ship.model.vertices[c];
          ctx.lineTo(vert[0], vert[1]);
        }
        ctx.closePath();
        ctx.fillStyle = ship.color;
        ctx.fill();
        ctx.restore();
      },

      //draws the given ship in the given camera
      drawShip: function drawShip(ship, camera) {
        //var shipArray = (Array.isArray(ship))?ship:[ship];

        interpolateWiValue(ship, 'x');
        interpolateWiValue(ship, 'y');
        interpolateWiValue(ship, 'rotation');
        var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x, ship.y); //get ship's position in camera space

        if (shipPosInCameraSpace[0] - ship.radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + ship.radius * camera.zoom < 0 || shipPosInCameraSpace[1] - ship.radius * camera.zoom > camera.height || shipPosInCameraSpace[1] + ship.radius * camera.zoom < 0) return;

        var ctx = camera.ctx;
        ctx.save();
        ctx.translate(shipPosInCameraSpace[0], shipPosInCameraSpace[1]); //translate to camera space position
        ctx.rotate((ship.rotation - camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

        ctx.scale(camera.zoom, camera.zoom); //scale by zoom value

        //Thrusters
        var width = ship.model.thrusterPoints.width;
        //forward thrust
        for (var c = 0; c <= thrusterDetail; c++) {
          ctx.fillStyle = shadeRGBColor(worldInfo.targets[ship.id].thrusterColor, .5 * c);
          ctx.save();
          ctx.beginPath();

          //Medial Thrusters
          //forward
          interpolateWiValue(ship, 'medial');
          var trailLength = 40 * ship.medial * (1 - c / (thrusterDetail + 1));

          if (ship.medial > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.medial.positive.length; n++) {
              var tp = ship.model.thrusterPoints.medial.positive[n];
              ctx.moveTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
              ctx.lineTo(tp[0] - rightVector[0] * width / 2, tp[1] - rightVector[1] * width / 2);
              ctx.lineTo(tp[0] + upVector[0] * trailLength, tp[1] + upVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
            }
          }
          //backward
          else if (ship.medial < 0) {
              for (var n = 0; n < ship.model.thrusterPoints.medial.positive.length; n++) {
                var tp = ship.model.thrusterPoints.medial.negative[n];
                ctx.moveTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
                ctx.lineTo(tp[0] - rightVector[0] * width / 2, tp[1] - rightVector[1] * width / 2);
                ctx.lineTo(tp[0] + upVector[0] * trailLength, tp[1] + upVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
                ctx.lineTo(tp[0] + rightVector[0] * width / 2, tp[1] + rightVector[1] * width / 2);
              }
            }

          //rotational thrusters	
          interpolateWiValue(ship, 'rotational');
          trailLength = 40 * ship.rotational * (1 - c / (thrusterDetail + 1));
          //ccw
          if (ship.rotational > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.rotational.positive.length; n++) {
              var tp = ship.model.thrusterPoints.rotational.positive[n];
              ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
              ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
            }
          }
          //cw
          else if (ship.rotational < 0) {
              for (var n = 0; n < ship.model.thrusterPoints.rotational.negative.length; n++) {
                var tp = ship.model.thrusterPoints.rotational.negative[n];
                ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
                ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
                ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
                ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              }
            }

          //lateral thrusters
          interpolateWiValue(ship, 'lateral');
          trailLength = 40 * ship.lateral * (1 - c / (thrusterDetail + 1));
          //rightward
          if (ship.lateral > 0) {
            for (var n = 0; n < ship.model.thrusterPoints.lateral.positive.length; n++) {
              var tp = ship.model.thrusterPoints.lateral.positive[n];
              ctx.moveTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
              ctx.lineTo(tp[0] - upVector[0] * width / 2, tp[1] - upVector[1] * width / 2);
              ctx.lineTo(tp[0] + rightVector[0] * trailLength, tp[1] + rightVector[1] * trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
              ctx.lineTo(tp[0] + upVector[0] * width / 2, tp[1] + upVector[1] * width / 2);
            }
          }
          //leftward
          else if (ship.lateral < 0) {
              //ctx.save();				
              //ctx.beginPath();
              /*ctx.moveTo(10,0);
              ctx.lineTo(10,-5);
              ctx.lineTo(10-40*(ship.thrusterSystem.lateral.currentStrength/ship.thrusterSystem.lateral.efficiency)*(1-(c/(this.thrusterDetail+1))),-2.5);
              ctx.lineTo(10,0);*/
              //ctx.globalAlpha = ((c+1)/(this.thrusterDetail+1));
              //ctx.fill();
              //ctx.restore();
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
        interpolateWiValue(ship, 'shp');
        interpolateWiValue(ship, 'shc');
        if (ship.shp > 0) {
          //console.log(ship.shp+', '+ship.shc);
          var shieldCoeff = ship.shc;
          ctx.save();
          ctx.fillStyle = 'dodgerblue';
          ctx.beginPath();
          for (var n = 0; n < ship.model.shieldVectors.length; n++) {
            var vert = ship.model.vertices[n];
            var vec = ship.model.shieldVectors[n];
            var shieldVert = [vert[0] + vec[0] * shieldCoeff, vert[1] + vec[1] * shieldCoeff];
            if (n == 0) ctx.moveTo(shieldVert[0], shieldVert[1]);else ctx.lineTo(shieldVert[0], shieldVert[1]);
          }
          ctx.globalAlpha = ship.shp;
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
        ctx.fillStyle = worldInfo.targets[ship.id].color;
        ctx.fill();
        ctx.restore();
      },

      //draws all laser objects in the given array to the given camera
      drawHitscans: function drawHitscans(hitscans, camera) {
        var ctx = camera.ctx;
        for (var n = 0; n < hitscans.length; n++) {
          //if(hitscan.power == 0)
          //	return;
          var hitscan = hitscans[n];
          if (!worldInfo.drawing[hitscan.id]) return;
          if (!worldInfo.targets[hitscan.id]) {
            removeIndexFromWiCollection(n, worldInfo.hitscans);
            n--;
            continue;
          }
          interpolateWiValue(hitscan, 'startX');
          interpolateWiValue(hitscan, 'startY');
          interpolateWiValue(hitscan, 'endX');
          interpolateWiValue(hitscan, 'endY');
          interpolateWiValue(hitscan, 'power');
          interpolateWiValue(hitscan, 'efficiency');
          var start = camera.worldPointToCameraSpace(hitscan.startX, hitscan.startY);
          var end = camera.worldPointToCameraSpace(hitscan.endX, hitscan.endY);
          var angle = utilities.angleBetweenVectors(end[0] - start[0], end[1] - start[1], 1, 0);
          var rightVector = utilities.rotate(0, 0, 1, 0, angle + 90);
          var width = hitscan.power && hitscan.efficiency ? hitscan.power / hitscan.efficiency * camera.zoom : 0;
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
            ctx.fillStyle = shadeRGBColor(worldInfo.targets[hitscan.id].color, 0 + c / (hitscanDetail + 1));
            /*ctx.lineTo(end[0], end[1]);
            ctx.lineTo(endNext[0], endNext[1]);
            ctx.lineTo(startNext[0], startNext[1]);
            ctx.fillStyle = hitscan.color;*/
            ctx.fill();
            ctx.restore();
          }
        }
      },

      //draws all projectile objects in the given array to the given camera
      drawProjectiles: function drawProjectiles(projectiles, camera, dt) {
        var ctx = camera.ctx;
        for (var c = 0; c < projectiles.length; c++) {
          var prj = projectiles[c];
          if (!worldInfo.drawing[prj.id]) continue;
          if (!worldInfo.targets[prj.id]) {
            removeIndexFromWiCollection(c, worldInfo.prjs);
            c--;
            continue;
          }
          interpolateWiValue(prj, 'x');
          interpolateWiValue(prj, 'y');
          var start = camera.worldPointToCameraSpace(prj.x, prj.y);
          var end = camera.worldPointToCameraSpace(prj.x + worldInfo.targets[prj.id].velocityX * dt, prj.y + worldInfo.targets[prj.id].velocityY * dt);
          var radius = worldInfo.targets[prj.id].radius;

          if (start[0] > camera.width + radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius) continue;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.strokeStyle = worldInfo.targets[prj.id].color;
          var width = radius * camera.zoom;
          ctx.lineWidth = width > 1 ? width : 1;
          ctx.stroke();
          ctx.restore();
        }
      },

      drawRadials: function drawRadials(radials, camera, dt) {
        var ctx = camera.ctx;
        for (var c = 0; c < radials.length; c++) {
          var radial = radials[c];
          if (!worldInfo.drawing[radial.id]) return;
          if (!worldInfo.targets[radial.id]) {
            removeIndexFromWiCollection(c, worldInfo.radials);
            c--;
            continue;
          }
          interpolateWiValue(radial, 'x');
          interpolateWiValue(radial, 'y');
          interpolateWiValue(radial, 'radius');
          interpolateWiValue(radial, 'velocity');
          var center = camera.worldPointToCameraSpace(radial.x, radial.y);
          var frameVelocity = radial.velocity * dt;

          if (center[0] > camera.width + radial.radius + frameVelocity || center[0] < 0 - radial.radius - frameVelocity || center[1] > camera.height + radial.radius + frameVelocity || center[1] < 0 - radial.radius - frameVelocity) return;

          ctx.save();
          ctx.beginPath();
          ctx.arc(center[0], center[1], (radial.radius + frameVelocity / 2) * camera.zoom, 0, Math.PI * 2);
          ctx.strokeStyle = worldInfo.targets[radial.id].color;
          var width = frameVelocity * camera.zoom;
          ctx.lineWidth = width > .3 ? width : .1;
          ctx.stroke();
          ctx.restore();
        };
      },

      //draws the projected overlay for all asteroids in the given array to the given main and projected cameras
      drawAsteroidsOverlay: function drawAsteroidsOverlay(asteroids, camera, gridCamera) {
        var start = [0, 0];
        var end = [camera.width, camera.height];
        var ctx = camera.ctx;
        var cameraPositions = [];
        if (gridCamera) {
          ctx.save();
          ctx.beginPath();
          for (var c = 0; c < asteroids.objs.length; c++) {
            var asteroid = asteroids.objs[c];
            var gridPosition = gridCamera.worldPointToCameraSpace(asteroid.x, asteroid.y);
            if (gridPosition[0] + asteroid.radius * gridCamera.zoom < start[0] || gridPosition[0] - asteroid.radius * gridCamera.zoom > end[0] || gridPosition[1] + asteroid.radius * gridCamera.zoom < start[1] || gridPosition[1] - asteroid.radius * gridCamera.zoom > end[1]) continue;
            cameraPositions[c] = camera.worldPointToCameraSpace(asteroid.x, asteroid.y);
            ctx.moveTo(cameraPositions[c][0], cameraPositions[c][1]);
            ctx.lineTo(gridPosition[0], gridPosition[1]);
            ctx.moveTo(gridPosition[0], gridPosition[1]);
            //ctx.beginPath();
            ctx.arc(gridPosition[0], gridPosition[1], asteroid.radius * gridCamera.zoom, 0, Math.PI * 2);
          }
          ctx.strokeStyle = 'grey';
          ctx.lineWidth = .5;
          ctx.globalAlpha = .5;
          ctx.stroke();
          ctx.restore();
        }
      },

      //draws asteroids from the given asteroids array to the given camera
      drawAsteroids: function drawAsteroids(asteroids, camera) {
        var start = [0, 0];
        var end = [camera.width, camera.height];
        var ctx = camera.ctx;
        for (var group = 0; group < asteroids.colors.length; group++) {
          ctx.save();
          ctx.fillStyle = asteroids.colors[group];
          ctx.beginPath();
          for (var c = 0; c < asteroids.objs.length; c++) {
            var asteroid = asteroids.objs[c];
            if (asteroid.colorIndex != group) continue;

            var finalPosition = camera.worldPointToCameraSpace(asteroid.x, asteroid.y); //get asteroid's position in camera space

            if (finalPosition[0] + asteroid.radius * camera.zoom < start[0] || finalPosition[0] - asteroid.radius * camera.zoom > end[0] || finalPosition[1] + asteroid.radius * camera.zoom < start[1] || finalPosition[1] - asteroid.radius * camera.zoom > end[1]) continue;
            ctx.moveTo(finalPosition[0], finalPosition[1]);
            ctx.arc(finalPosition[0], finalPosition[1], asteroid.radius * camera.zoom, 0, Math.PI * 2);
          };
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        };
      },

      //draws the heads-up display to the given camera
      drawHUD: function drawHUD(camera) {
        var ctx = camera.ctx;
        ctx.save(); // NEW
        ctx.textAlign = 'center';
        ctx.textBaseline = 'center';
        ctx.fillRect(0, camera.height, camera.width, -30);
        utilities.fillText(ctx, hudInfo.stabilized ? 'assisted' : 'manual', camera.width / 2, camera.height - 10, "bold 12pt Orbitron", hudInfo.stabilized ? 'green' : 'red');
        ctx.textAlign = 'left';
        utilities.fillText(ctx, 'limiter', 10, camera.height - 10, "8pt Orbitron", 'white');
        if (hudInfo.velocityClamps.enabled) {
          ctx.textAlign = 'right';
          utilities.fillText(ctx, Math.round(hudInfo.velocityClamps.medial), 110, camera.height - 10, "10pt Orbitron", 'green');
          utilities.fillText(ctx, Math.round(hudInfo.velocityClamps.lateral), 160, camera.height - 10, "10pt Orbitron", 'cyan');
          utilities.fillText(ctx, Math.round(hudInfo.velocityClamps.rotational), 195, camera.height - 10, "10pt Orbitron", 'yellow');
        } else {
          ctx.textAlign = 'left';
          utilities.fillText(ctx, 'disabled', 110, camera.height - 10, "10pt Orbitron", 'red');
        }
        //utilities.fillText(ctx, "Thruster clamps: "+((this.ship.stabilizer.clamps.enabled)?'Medial '+Math.round(this.ship.stabilizer.clamps.medial)+' Lateral '+Math.round(this.ship.stabilizer.clamps.lateral)+' Rotational '+Math.round(this.ship.stabilizer.clamps.rotational):'disabled'),0,camera.height-10,"12pt Prime",'white')
        ctx.textAlign = 'right';
        //utilities.fillText(ctx,'T '+Math.round(updaters.getPowerForComponent(ship.powerSystem,enums.SHIP_COMPONENTS.THRUSTERS)*100)+'%',camera.width-220,camera.height-10,"10pt Orbitron",'green');
        //utilities.fillText(ctx,' L '+Math.round(updaters.getPowerForComponent(ship.powerSystem,enums.SHIP_COMPONENTS.LASERS)*100)+'%',camera.width-120,camera.height-10,"10pt Orbitron",'red');
        //utilities.fillText(ctx,' S '+Math.round(updaters.getPowerForComponent(ship.powerSystem,enums.SHIP_COMPONENTS.SHIELDS)*100)+'%',camera.width-20,camera.height-10,"10pt Orbitron",'dodgerblue');

        ctx.restore(); // NEW
      },

      //draws the minimap to the given camera
      //note that the minimap camera has a viewport
      drawMinimap: function drawMinimap(camera, grid) {
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
        drawing.drawAsteroids(worldInfo.asteroids, camera);
        for (var n = worldInfo.objs.length - 1; n >= 0; n--) {
          var ship = worldInfo.objs[n];
          drawing.drawShipMinimap(ship, camera);
        }
        ctx.restore();
      },

      drawTitleScreen: function drawTitleScreen(camera) {
        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.globalAlpha = .5;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        utilities.fillText(ctx, "Space Battle With Lasers", camera.width / 2, camera.height / 5, "bold 64pt Aroma", 'blue', .5);
        utilities.fillText(ctx, "SPACE BATTLE WITH LASERS", camera.width / 2, camera.height / 5, "bold 24pt Aroma", 'white');
        utilities.fillText(ctx, "Press ENTER to start", camera.width / 2, 4 * camera.height / 5, "12pt Orbitron", 'white');
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

      //draw pause screen in the given camera
      drawChooseShipScreen: function drawChooseShipScreen(camera, entry) {
        var shipList = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

        var ctx = camera.ctx;
        ctx.save();
        ctx.fillStyle = "black", ctx.globalAlpha = .03;
        ctx.fillRect(0, 0, camera.width, camera.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        utilities.fillText(ctx, "Enter ship name: " + entry, camera.width / 2, camera.height / 2 - 30, "24pt Aroma", 'white');
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
        utilities.fillText(ctx, "WASD moves your ship", camera.width / 10, camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "LEFT and RIGHT arrow or mouse turns your ship", camera.width / 10, 2 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "UP and DOWN arrow or mouse-wheel zooms the camera", camera.width / 10, 3 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "SPACE or LEFT-CLICK fires your laser", camera.width / 10, 4 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "SHIFT over-charges your thrusters", camera.width / 10, 5 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "ALT over-charges your shield", camera.width / 10, 6 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "RIGHT-CLICK over-charges your laser", camera.width / 10, 7 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "C toggles the velocity limiter", camera.width / 10, 8 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "TAB switches between assisted and manual controls", camera.width / 10, 9 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "P pauses, F turns off the star-field graphics (they can be a resource hog)", camera.width / 10, 10 * camera.height / 12, "10pt Orbitron", 'white');
        utilities.fillText(ctx, "Play around for a bit, then press ENTER to start the game. Your goal is to destroy all enemy ships", camera.width / 10, 11 * camera.height / 12, "10pt Orbitron", 'white');
        //this.fill
      }
    };

    module.exports = drawing;
  }, { "../server/utilities.js": 5, "./worldInfo.js": 3 }], 3: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/client.js

    var utilities = require('../server/utilities.js');

    var wiInterval = 0;
    var lastWorldUpdate = 0;

    var playerInfo = {
      x: 0,
      y: 0,
      rotation: 0,
      velX: 0,
      velY: 0,
      rotationalVelocity: 0
    };
    var lastPlayerInfo = {
      x: 0,
      y: 0,
      rotation: 0,
      velX: 0,
      velY: 0,
      rotationalVelocity: 0
    };
    var hudInfo = {};
    var worldInfo = {
      objs: [],
      asteroids: [],
      radials: [],
      prjs: [],
      hitscans: [],
      drawing: {},
      targets: {},
      previousTargets: {}
    };

    function interpolateWiValue(obj, val) {
      var now = Date.now().valueOf();
      //console.log(updateInterval);
      var perc = (now - lastWorldUpdate) / wiInterval;
      var prevObj = worldInfo.previousTargets[obj.id];
      var currentObj = worldInfo.targets[obj.id];
      obj[val] = utilities.lerp(prevObj[val], currentObj[val], utilities.clamp(0, perc, 1));
      return obj[val];
    }

    function removeIndexFromWiCollection(index, collection) {
      var obj = collection[index];
      delete worldInfo.targets[obj.id];
      delete worldInfo.previousTargets[obj.id];
      delete worldInfo.drawing[obj.id];
      collection.splice(index, 1);
    }

    function pushCollectionFromDataToWI(dwi, type) {
      for (var c = 0; c < dwi[type].length; c++) {
        var obj = dwi[type][c];
        if (worldInfo.drawing.hasOwnProperty(obj.id)) {
          worldInfo.targets[obj.id] = obj;
          worldInfo.drawing[obj.id] = true;
        } else {
          worldInfo.previousTargets[obj.id] = utilities.deepObjectMerge.call({}, obj);
          worldInfo[type].push(obj);
          worldInfo.drawing[obj.id] = false;
        }
      }
    }

    function resetWi() {
      worldInfo.objs = [];
      worldInfo.asteroids = [];
      worldInfo.radials = [];
      worldInfo.prjs = [];
      worldInfo.hitscans = [];
      worldInfo.drawing = {};
      worldInfo.targets = {};
      worldInfo.previousTargets = {};
    }

    module.exports = {
      playerInfo: playerInfo,
      lastPlayerInfo: lastPlayerInfo,
      hudInfo: hudInfo,
      worldInfo: worldInfo,
      interpolateWiValue: interpolateWiValue,
      removeIndexFromWiCollection: removeIndexFromWiCollection,
      pushCollectionFromDataToWI: pushCollectionFromDataToWI,
      resetWi: resetWi,
      setWiInterval: function setWiInterval(wii) {
        wiInterval = wii;
      },
      setLastWorldUpdate: function setLastWorldUpdate(lwu) {
        lastWorldUpdate = lwu;
      }
    };
  }, { "../server/utilities.js": 5 }], 4: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/keys.js

    var myKeys = {};

    myKeys.KEYBOARD = Object.freeze({
      KEY_LEFT: 37,
      KEY_UP: 38,
      KEY_RIGHT: 39,
      KEY_DOWN: 40,
      KEY_SPACE: 32,
      KEY_SHIFT: 16,
      KEY_ALT: 18,
      KEY_W: 87,
      KEY_A: 65,
      KEY_D: 68,
      KEY_S: 83,
      KEY_Q: 81,
      KEY_E: 69,
      KEY_TAB: 9,
      KEY_F: 70,
      KEY_R: 82,
      KEY_C: 67,
      KEY_P: 80,
      KEY_CTRL: 17,
      KEY_J: 74,
      KEY_K: 75,
      KEY_L: 76,
      KEY_ENTER: 13
    });

    var myMouse = {};

    myMouse.BUTTONS = Object.freeze({
      LEFT: 0,
      MIDDLE: 1,
      RIGHT: 2
    });

    module.exports = { myKeys: myKeys, myMouse: myMouse };
  }, {}], 5: [function (require, module, exports) {
    // Heavily adapted from a previous project of mine:
    // https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

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

      getRandomIntInclusive: function getRandomIntInclusive(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      circlesIntersect: function circlesIntersect(c1, c2) {
        var dx = c2.x - c1.x;
        var dy = c2.y - c1.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
      },
      // Function Name: getRandomColor()
      // returns a random color of alpha 1.0
      // http://paulirish.com/2009/random-hex-color-code-snippets/
      getRandomColor: function getRandomColor() {
        var red = Math.round(Math.random() * 200 + 55);
        var green = Math.round(Math.random() * 200 + 55);
        var blue = Math.round(Math.random() * 200 + 55);
        var color = "rgb(" + red + "," + green + "," + blue + ")";
        // OR if you want to change alpha
        // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
        return color;
      },
      getRandomBrightColor: function getRandomBrightColor() {
        var h = Math.round(Math.random() * 360);
        var color = "hsl(" + h + ",100%,65%)";
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

      deepObjectMerge: function deepObjectMerge(src) {
        var _this = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          // if the current attribute is an object in the source
          if (src[key] instanceof Object && !(src[key] instanceof Array)) {
            // if the current attribute isn't in the this, or isn't an object in the this
            if (!_this[key] || !(_this[key] instanceof Object && !(_this[key] instanceof Array))) {
              // make it an empty object
              _this[key] = {};
            }
            // then deep merge the two
            if (key === 'specialProperties') {
              if (!_this[key]) {
                _this[key] = {};
              }
              utilities.shallowObjectMerge.call(_this[key], src[key]);
            } else {
              utilities.deepObjectMerge.call(_this[key], src[key]);
            }
          } else {
            // if current attribute is an array in the source, give this a copy of it
            // this[key] = (Array.isArray(src[key])) ? src[key].slice() : src[key];

            // we'll worry about referencing bugs later
            _this[key] = src[key];
          }
        });

        return this;
      },
      veryShallowObjectMerge: function veryShallowObjectMerge(src) {
        var _this2 = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          if (key === 'specialProperties') {
            if (!_this2[key]) {
              _this2[key] = {};
            }
            utilities.shallowObjectMerge.call(_this2[key], src[key]);
            return;
          }
          // if the current attribute is an object in the source
          if (!(src[key] instanceof Object) || src[key] instanceof Array) {
            _this2[key] = src[key];
          }
        });

        return this;
      },
      shallowObjectMerge: function shallowObjectMerge(src) {
        var _this3 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          _this3[key] = src[key];
        });

        return this;
      }
    };

    module.exports = utilities;
  }, {}] }, {}, [1]);
