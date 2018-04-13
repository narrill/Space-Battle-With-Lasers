"use strict";

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
    var Menu = function () {
      function Menu(elements) {
        _classCallCheck(this, Menu);

        this.elements = elements;
        this.cursor = 0;
      }

      _createClass(Menu, [{
        key: "draw",
        value: function draw(ctx, x, y, font, active) {
          var color = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'white';

          ctx.save();
          ctx.font = font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = color;
          var height = ctx.measureText("M").width;
          var lineHeight = height * 1.5;
          y += this.elements.length * lineHeight / 2;
          for (var i = this.elements.length - 1; i >= 0; --i) {
            if (active && this.cursor === i) {
              ctx.save();
              var width = ctx.measureText(this.elements[i].text).width;
              ctx.globalAlpha = 0.5;
              ctx.fillStyle = 'blue';
              ctx.fillRect(x - width / 2, y - height, width, height);
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
  }, {}], 2: [function (require, module, exports) {
    var utilities = require('../server/utilities.js');
    var Menu = require('./Menu.js');
    var requests = require('./requests');

    var canvas = void 0;
    var ctx = void 0;

    var csrf = void 0;

    var signup = false;

    var activeElement = void 0;
    var error = void 0;

    var Prompt = function () {
      function Prompt(text, submitFunc) {
        var masked = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        _classCallCheck(this, Prompt);

        this.text = text;
        this.submitFunc = submitFunc;
        this._entry = "";
        this.masked = masked;
      }

      _createClass(Prompt, [{
        key: "draw",
        value: function draw(ctx) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 1;
          utilities.fillText(ctx, this.text + ": " + this.entry, canvas.width / 2, canvas.height / 2, "24pt Orbitron", 'black');
        }
      }, {
        key: "key",
        value: function key(e) {
          if (e.key === 'Backspace') {
            if (this._entry.length > 0) this._entry = this._entry.slice(0, -1);
          } else if (e.key === 'Enter') {
            this.submitFunc();
          } else this._entry += e.key;
        }
      }, {
        key: "clear",
        value: function clear() {
          this._entry = "";
        }
      }, {
        key: "entry",
        get: function get() {
          if (this.masked) {
            var str = "";
            for (var c = 0; c < this._entry.length; ++c) {
              str += '*';
            }return str;
          } else return this._entry;
        }
      }]);

      return Prompt;
    }();

    var menu = void 0;
    var userPrompt = void 0;
    var passwordPrompt = void 0;
    var password2Prompt = void 0;

    userPrompt = new Prompt("Username", function () {
      activeElement = passwordPrompt;
    });

    passwordPrompt = new Prompt("Password", function () {
      if (signup) activeElement = password2Prompt;else requests.postRequest('/login', { username: userPrompt._entry, pass: passwordPrompt._entry }, csrf, function (status, res) {
        if (status === 200) window.location.replace(res.redirect);else {
          error = res.error;
          activeElement = menu;
        }
        userPrompt.clear();
        passwordPrompt.clear();
      });
    }, true);

    password2Prompt = new Prompt("Repeat password", function () {
      requests.postRequest('/signup', { username: userPrompt._entry, pass: passwordPrompt._entry, pass2: password2Prompt._entry }, csrf, function (status, res) {
        if (status === 200) window.location.replace(res.redirect);else {
          error = res.error;
          activeElement = menu;
        }
        userPrompt.clear();
        passwordPrompt.clear();
        password2Prompt.clear();
      });
    }, true);

    menu = new Menu([{ text: 'Login', func: function func() {
        signup = false;
        activeElement = userPrompt;
      } }, { text: 'Signup', func: function func() {
        signup = true;
        activeElement = userPrompt;
      } }]);

    var BOX_HEIGHT = 200;

    var draw = function draw() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.fillRect(0, canvas.height / 2 - BOX_HEIGHT / 2, canvas.width, BOX_HEIGHT);

      activeElement.draw(ctx);

      if (error) utilities.fillText(ctx, error, canvas.width / 2, canvas.height / 2 + BOX_HEIGHT, "24pt Orbitron", "white");

      requestAnimationFrame(draw);
    };

    window.onkeydown = function (e) {
      activeElement.key(e);
    };

    window.onload = function () {
      csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
      document.body.appendChild(canvas);

      ctx = canvas.getContext('2d');
      menu.draw = menu.draw.bind(menu, ctx, canvas.width / 2, canvas.height / 2, '24pt Orbitron', true, 'black');
      activeElement = menu;
      requestAnimationFrame(draw);
    };
  }, { "../server/utilities.js": 4, "./Menu.js": 1, "./requests": 3 }], 3: [function (require, module, exports) {
    module.exports = {
      getRequest: function getRequest(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
          callback(JSON.parse(xhr.response));
        };
        xhr.open('GET', url);
        xhr.setRequestHeader('Accept', "application/json");
        xhr.send();
      },
      postRequest: function postRequest(url, data, csrf, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onload = function () {
          console.log(xhr.response);
          callback(xhr.status, JSON.parse(xhr.response));
        };
        xhr.setRequestHeader('CSRF-Token', csrf);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(JSON.stringify(data));
      }
    };
  }, {}], 4: [function (require, module, exports) {
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
      function ColorRGB(_ref) {
        var r = _ref.r,
            g = _ref.g,
            b = _ref.b;

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
      function ColorHSL(_ref2) {
        var h = _ref2.h,
            s = _ref2.s,
            l = _ref2.l;

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
        var _this2 = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          // if the current attribute is an object in the source
          if (src[key] instanceof Object && !(src[key] instanceof Array)) {
            // if the current attribute isn't in the this, or isn't an object in the this
            if (!has.call(_this2, key) || !(_this2[key] instanceof Object && !(_this2[key] instanceof Array))) {
              // make it an empty object
              _this2[key] = {};
            }
            // then deep merge the two
            if (key === 'specialProperties') {
              if (!_this2[key]) {
                _this2[key] = {};
              }
              utilities.shallowObjectMerge.call(_this2[key], src[key]);
            } else {
              utilities.deepObjectMerge.call(_this2[key], src[key]);
            }
          } else {
            // if current attribute is an array in the source, give this a copy of it
            // this[key] = (Array.isArray(src[key])) ? src[key].slice() : src[key];

            // we'll worry about referencing bugs later
            _this2[key] = src[key];
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
        var _this3 = this;

        if (!src) {
          return this;
        }
        // loop through source's attributes
        Object.keys(src).forEach(function (key) {
          if (key === 'specialProperties') {
            if (!has.call(_this3, key)) {
              _this3[key] = {};
            }
            utilities.shallowObjectMerge.call(_this3[key], src[key]);
            return;
          }
          // if the current attribute is an object in the source
          if (!(src[key] instanceof Object) || src[key] instanceof Array) {
            _this3[key] = src[key];
          }
        });

        return this;
      },


      // merge src onto this. objects and arrays are copied by reference
      shallowObjectMerge: function shallowObjectMerge(src) {
        var _this4 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          _this4[key] = src[key];
        });

        return this;
      },


      // copy src onto this, ignoring properties that aren't present in this
      // and properties that are objects or arrays
      veryShallowUnionOverwrite: function veryShallowUnionOverwrite(src) {
        var _this5 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          if (has.call(_this5, key) && !(src[key] instanceof Object || src[key] instanceof Array)) {
            _this5[key] = src[key];
          }
        });

        return this;
      },


      // copy src onto this recursively, ignoring properties that aren't present in this
      // To-do
      deepUnionOverwrite: function deepUnionOverwrite(src) {
        var _this6 = this;

        if (!src) {
          return this;
        }
        Object.keys(src).forEach(function (key) {
          if (!has.call(_this6, key)) return;
          if (src[key] instanceof Object) {
            utilities.deepUnionOverwrite.call(_this6[key], src[key]);
          } else {
            _this6[key] = src[key];
          }
        });

        return this;
      }
    };

    module.exports = utilities;
  }, {}] }, {}, [2]);
