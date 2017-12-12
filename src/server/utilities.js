// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/utilities.js

class Capsule {
  constructor(x1, y1, x2, y2, r) {
    this.center1 = [x1, y1];
    this.center2 = [x2, y2];
    this.radius = r;
  }
}

class VelocityCapsule extends Capsule {
  constructor(object, dt) {
    super(
      object.x,
      object.y,
      object.x + (object.velocityX * dt),
      object.y + (object.velocityY * dt),
      object.destructible.radius,
    );
  }
}

class ColorRGB {
  constructor({ r, g, b }) {
    this.r = r;
    this.g = g;
    this.b = b;
    this._generateColorString();
  }

  _generateColorString() {
    this.colorString = `rgb(${this.r},${this.g},${this.b})`;
  }

  shade(percent) {
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * (-1) : percent;
    const r = Math.round((t - this.r) * p) + this.r;
    const g = Math.round((t - this.g) * p) + this.g;
    const b = Math.round((t - this.b) * p) + this.b;
    return new ColorRGB({ r, g, b });
  }
}

ColorRGB.serializableProperties = [
  { key: 'r', type: 'Uint8' },
  { key: 'g', type: 'Uint8' },
  { key: 'b', type: 'Uint8' },
];

class ColorHSL {
  constructor({ h, s, l }) {
    this.h = h;
    this.s = s;
    this.l = l;
    this.colorString = `hsl(${this.h},${this.s}%,${this.l}%)`;
  }

  shade(percent) {
    const t = percent < 0 ? 0 : 100;
    const p = percent < 0 ? percent * (-1) : percent;
    const l = Math.round((t - this.l) * p) + this.l;
    return new ColorHSL({ h: this.h, s: this.s, l });
  }
}

ColorHSL.serializableProperties = [
  { key: 'h', type: 'Uint16' },
  { key: 's', type: 'Uint8' },
  { key: 'l', type: 'Uint8' },
];

const utilities = {
  getForwardVector() {
    // console.log(this.rotation);
    if (!this.forwardVectorX || !this.forwardVectorY) {
      const normalizedForwardVector = utilities.rotate(0, 0, 0, -1, -this.rotation);
      this.forwardVectorX = normalizedForwardVector[0];
      this.forwardVectorY = normalizedForwardVector[1];
    }

    return [this.forwardVectorX, this.forwardVectorY];
  },

  getRightVector() {
    if (!this.rightVectorX || !this.rightVectorY) {
      const normalizedRightVector = utilities.rotate(0, 0, 0, -1, -this.rotation + 90);
      this.rightVectorX = normalizedRightVector[0];
      this.rightVectorY = normalizedRightVector[1];
    }

    return [this.rightVectorX, this.rightVectorY];
  },

  getMedialVelocity() {
    if (!this.medialVelocity) {
      const forwardVector = utilities.getForwardVector.call(this);
      this.medialVelocity = -utilities.scalarComponentOf1InDirectionOf2(
        this.velocityX,
        this.velocityY,
        forwardVector[0],
        forwardVector[1],
      ); // get magnitude of projection of velocity onto the forward vector
    }

    return this.medialVelocity;
  },

  getLateralVelocity() {
    if (!this.lateralVelocity) {
      const rightVector = utilities.getRightVector.call(this);
      this.lateralVelocity = -utilities.scalarComponentOf1InDirectionOf2(
        this.velocityX,
        this.velocityY,
        rightVector[0],
        rightVector[1],
      ); // et magnitude of velocity's projection onto the right vector
    }
    return this.lateralVelocity;
  },
  fillText: (ctx, string, x, y, css, color, alpha) => {
    ctx.save();
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    ctx.font = css;
    ctx.fillStyle = color;
    if (alpha) { ctx.globalAlpha = alpha; }
    ctx.fillText(string, x, y);
    ctx.restore();
  },
  calculateDeltaTime() {
    const now = (Date.now().valueOf()); // get date as unix timestamp
    const fps = 1000 / (now - this.lastTime);
    this.lastTime = now;
    if (isNaN(fps)) { return 0; }
    return 1 / fps;
  },
  getRandom: (min, max) => (Math.random() * (max - min)) + min,
  getRandomIntIncExc: (min, max) => Math.floor((Math.random() * (max - min))) + min,
  getRandomIntInclusive: (min, max) => Math.floor((Math.random() * ((max - min) + 1))) + min,
  circlesIntersect: (c1, c2) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    return distance < c1.radius + c2.radius;
  },
  distanceSqrBetweenPoints(x1, y1, x2, y2) {
    return ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
  },
  ColorRGB,
  ColorHSL,
  // Function Name: getRandomColor()
  // returns a random color of alpha 1.0
  // http://paulirish.com/2009/random-hex-color-code-snippets/
  getRandomColor: () => {
    const red = Math.round((Math.random() * 200) + 55);
    const green = Math.round((Math.random() * 200) + 55);
    const blue = Math.round((Math.random() * 200) + 55);
    const color = new ColorRGB({ r: red, g: green, b: blue });
    // OR if you want to change alpha
    // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
    return color;
  },
  getRandomBrightColor: () => {
    const h = Math.round(Math.random() * 360);
    const color = new ColorHSL({ h, s: 100, l: 65 });
    // OR if you want to change alpha
    // var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50
    return color;
  },

  pointInsideCircle: (x, y, I) => {
    const dx = x - I.x;
    const dy = y - I.y;
    return (dx * dx) + (dy * dy) <= I.radius * I.radius;
  },

  getRandomUnitVector: () => {
    let x = utilities.getRandom(-1, 1);
    let y = utilities.getRandom(-1, 1);
    let length = Math.sqrt((x * x) + (y * y));
    if (length === 0) { // very unlikely
      x = 1; // point right
      y = 0;
      length = 1;
    } else {
      x /= length;
      y /= length;
    }

    return { x, y };
  },

  // Translates an arbitrary orientation into the range of -180 to 180
  correctOrientation: (orientation) => {
    let or = orientation;
    while (or > 180) { or -= 360; }
    while (or < -180) { or += 360; }

    return or;
  },

  rotationLerp: (from, to, percent) => {
    if (Math.abs(to - from) > 180) {
      const adjustment = (from > to) ? -360 : 360;
      return utilities.correctOrientation(utilities.lerp(from + adjustment, to, percent));
    }
    return utilities.lerp(from, to, percent);
  },

  clamp: (min, val, max) => Math.max(min, Math.min(max, val)),

  distanceSqr: (p1, p2) => {
    const vec = [p2[0] - p1[0], p2[1] - p1[1]];
    return (vec[0] * vec[0]) + (vec[1] * vec[1]);
  },

  // http://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
  // point to rotate around, point to rotate, angle to rotate by
  rotate: (cx, cy, x, y, angle) => {
    const angleRadians = (Math.PI / 180) * angle;
    return [
      ((Math.cos(angleRadians) * (x - cx)) + (Math.sin(angleRadians) * (y - cy))) + cx,
      ((Math.cos(angleRadians) * (y - cy)) - (Math.sin(angleRadians) * (x - cx))) + cy,
    ];
  },

  cross(p, q) {
    return ((p[0] * q[1]) - (p[1] * q[0]));
  },

  dotProduct: (x1, y1, x2, y2) => (x1 * x2) + (y1 * y2),

  normalizeVector: (x, y) => {
    const magnitude = Math.sqrt((x * x) + (y * y));
    return [x / magnitude, y / magnitude];
  },

  vectorMagnitudeSqr: (x, y) => (x * x) + (y * y),

  // broken
  componentOf1InDirectionOf2: (x1, y1, x2, y2) => {
    if ((x1 === 0 && y1 === 0) || (x2 === 0 && y2 === 0)) { return [0, 0]; }
    const dot = (x1 * x2) + (y1 * y2);
    const scalar = (dot * dot) / ((x2 * x2) + (y2 * y2));
    return [scalar * x1, scalar * y1];
  },

  // projects vector 1 onto vector 2 and returns the magnitude of the projection
  scalarComponentOf1InDirectionOf2: (x1, y1, x2, y2) => {
    if ((x1 === 0 && y1 === 0) || (x2 === 0 && y2 === 0)) { return 0; }
    // var dot = x1*x2+y1*y2;
    return ((x1 * x2) + (y1 * y2)) / Math.sqrt((x2 * x2) + (y2 * y2));
  },
  // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  distanceFromPointToLine: (x, y, x1, y1, x2, y2) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = (A * C) + (B * D);
    const lenSq = (C * C) + (D * D);
    let param = -1;
    if (lenSq !== 0) { param = dot / lenSq; }

    let xx;
    let yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + (param * C);
      yy = y1 + (param * D);
    }

    const dx = x - xx;
    const dy = y - yy;
    return [Math.sqrt((dx * dx) + (dy * dy)), param];
  },

  raySphereIntersect: (s, e, c, r) => {
    const l = [c[0] - s[0], c[1] - s[1]];
    const startToEnd = [e[0] - s[0], e[1] - s[1]];
    const magnitud = Math.sqrt((startToEnd[0] * startToEnd[0]) + (startToEnd[1] * startToEnd[1]));
    const direction = [startToEnd[0] / magnitud, startToEnd[1] / magnitud];
    const tca = (l[0] * direction[0]) + (l[1] * direction[1]);
    if (tca < 0) { return false; }
    const d = Math.sqrt(((l[0] * l[0]) + (l[1] * l[1])) - (tca * tca));
    if (d < 0) { return false; }
    const thc = Math.sqrt((r * r) - (d * d));
    return tca - thc;
  },

  Capsule,

  VelocityCapsule,

  isCapsuleWithinCircle: (circle, capsule) => {
    let capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    if (!(capsuleAxis[0] === 0 && capsuleAxis[1] === 0)) {
      capsuleAxis = utilities.normalizeVector(capsuleAxis[0], capsuleAxis[1]);
    }

    const pushedCenter1 = [
      capsule.center1[0] - (capsuleAxis[0] * capsule.radius),
      capsule.center1[1] - (capsuleAxis[1] * capsule.radius),
    ];
    let toCircleCenter = [
      circle.center[0] - pushedCenter1[0],
      circle.center[1] - pushedCenter1[1],
    ];

    if ((toCircleCenter[0] * toCircleCenter[0]) + (toCircleCenter[1] * toCircleCenter[1])
      > (circle.radius * circle.radius)) { return false; }

    const pushedCenter2 = [
      capsule.center2[0] - (capsuleAxis[0] * capsule.radius),
      capsule.center2[1] - (capsuleAxis[1] * capsule.radius),
    ];
    toCircleCenter = [
      circle.center[0] - pushedCenter2[0],
      circle.center[1] - pushedCenter2[1],
    ];
    if ((toCircleCenter[0] * toCircleCenter[0]) + (toCircleCenter[1] * toCircleCenter[1])
      > (circle.radius * circle.radius)) { return false; }

    return true;
  },

  circleCapsuleSAT: (circle, capsule) => {
    const axisCheck = utilities.circleCapsuleAxisCheck;

    // check first capsule's center axis
    const capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    if (!axisCheck(circle, capsule, capsuleAxis)) { return false; }

    // check first capsule's normal axis
    const capsuleNormal = [-capsuleAxis[1], capsuleAxis[0]];
    if (!axisCheck(circle, capsule, capsuleNormal)) { return false; }

    const circleAxis1 = [
      capsule.center1[0] - circle.center[0],
      capsule.center1[1] - circle.center[1],
    ];
    if (!axisCheck(circle, capsule, circleAxis1)) { return false; }

    const circleAxis2 = [
      capsule.center2[0] - circle.center[0],
      capsule.center2[1] - circle.center[1],
    ];
    if (!axisCheck(circle, capsule, circleAxis2)) { return false; }

    return true;
  },

  circleCapsuleAxisCheck: (circle, capsule, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let maxCapsule;
    let minCapsule;

    const dotProductLeft = circle.center[0] * normalizedAxis[0];
    const dotProductRight = circle.center[1] * normalizedAxis[1];
    const projectedCenter = dotProductLeft + dotProductRight;
    const maxCircle = projectedCenter + circle.radius;
    const minCircle = projectedCenter - circle.radius;

    const projectedCenters = [
      (capsule.center1[0] * normalizedAxis[0]) + (capsule.center1[1] * normalizedAxis[1]),
      (capsule.center2[0] * normalizedAxis[0]) + (capsule.center2[1] * normalizedAxis[1]),
    ];
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

  polygonCapsuleSAT: (polygon, capsule) => {
    const axisCheck = utilities.polygonCapsuleAxisCheck;

    // loop through polygon verts and do axis checks
    for (let i = 0; i < polygon.length; i++) {
      const nextPoint = (i === polygon.length - 1) ? polygon[0] : polygon[i + 1];
      // normal to axis between current point and next point
      const normalAxis = [-(nextPoint[1] - polygon[i][1]), nextPoint[0] - polygon[i][0]];
      // axis between current point and capsule center1
      const centerAxis1 = [
        capsule.center1[0] - polygon[i][0],
        capsule.center1[1] - polygon[i][1],
      ];
      // axis between current point and capsule center2
      const centerAxis2 = [
        capsule.center2[0] - polygon[i][0],
        capsule.center2[1] - polygon[i][1],
      ];
      if (!axisCheck(polygon, capsule, centerAxis1)
        || !axisCheck(polygon, capsule, centerAxis2)) {
        return false;
      } else if (normalAxis !== [0, 0] && !axisCheck(polygon, capsule, normalAxis)) {
        return false;
      }
    }

    // get axis between centers, and the normal to that axis
    const capsuleAxisNormal = [
      -(capsule.center2[1] - capsule.center1[1]),
      capsule.center2[0] - capsule.center1[0],
    ];
    const capsuleAxis = [
      capsule.center2[0] - capsule.center1[0],
      capsule.center2[1] - capsule.center1[1],
    ];
    // check those as well
    if (!axisCheck(polygon, capsule, capsuleAxisNormal)
      || !axisCheck(polygon, capsule, capsuleAxis)) {
      return false;
    }

    // if we made it this far there are no separating axes
    return true;
  },

  polygonCapsuleAxisCheck: (vertices, capsule, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let max1;
    let min1;
    let maxCapsule;
    let minCapsule;
    // loop through verts. project onto the axis and find the min/max
    for (let c = 0; c < vertices.length; c++) {
      const vert = vertices[c];
      const projectedVert = (vert[0] * normalizedAxis[0]) + (vert[1] * normalizedAxis[1]);
      if (c === 0 || projectedVert > max1) { max1 = projectedVert; }
      if (c === 0 || projectedVert < min1) { min1 = projectedVert; }
    }
    // project capsule centers onto the axis
    const projectedCenters = [
      (capsule.center1[0] * normalizedAxis[0]) + (capsule.center1[1] * normalizedAxis[1]),
      (capsule.center2[0] * normalizedAxis[0]) + (capsule.center2[1] * normalizedAxis[1]),
    ];
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

  capsuleCapsuleSAT: (capsule1, capsule2) => {
    const axisCheck = utilities.capsuleCapsuleAxisCheck;

    // check first capsule's center axis
    const capsule1Axis = [
      capsule1.center2[0] - capsule1.center1[0],
      capsule1.center2[1] - capsule1.center1[1],
    ];
    if (!axisCheck(capsule1, capsule2, capsule1Axis)) { return false; }

    // check first capsule's normal axis
    const capsule1Normal = [-capsule1Axis[1], capsule1Axis[0]];
    if (!axisCheck(capsule1, capsule2, capsule1Normal)) { return false; }

    // same for second capsule
    const capsule2Axis = [
      capsule2.center2[0] - capsule2.center1[0],
      capsule2.center2[1] - capsule2.center1[1],
    ];
    if (!axisCheck(capsule1, capsule2, capsule2Axis)) { return false; }

    const capsule2Normal = [-capsule2Axis[1], capsule2Axis[0]];
    if (!axisCheck(capsule1, capsule2, capsule2Normal)) { return false; }

    return true;
  },

  capsuleCapsuleAxisCheck: (capsule1, capsule2, axis) => {
    const normalizedAxis = utilities.normalizeVector(axis[0], axis[1]);
    let maxCapsule1;
    let minCapsule1;
    let maxCapsule2;
    let minCapsule2;

    // project capsule1's centers onto the axis
    const projectedCenters1 = [
      (capsule1.center1[0] * normalizedAxis[0]) + (capsule1.center1[1] * normalizedAxis[1]),
      (capsule1.center2[0] * normalizedAxis[0]) + (capsule1.center2[1] * normalizedAxis[1]),
    ];
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
    const projectedCenters2 = [
      (capsule2.center1[0] * normalizedAxis[0]) + (capsule2.center1[1] * normalizedAxis[1]),
      (capsule2.center2[0] * normalizedAxis[0]) + (capsule2.center2[1] * normalizedAxis[1]),
    ];
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
  angle: (cx, cy, ex, ey) => {
    const dy = ey - cy;
    const dx = ex - cx;
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= (180 / Math.PI); // rads to degs, range (-180, 180]
    theta += 180;
    return theta;
  },

  // http://blog.lexique-du-net.com/index.php?post/Calculate-the-real-difference-between-two-angle
  // s-keeping-the-sign
  // Cutting the link in half because of the 100 character line limit in AirBnB's style guide. Fuc
  // k AirBnb and their stupid style guide.
  differenceBetweenAngles: (firstAngle, secondAngle) => {
    let difference = secondAngle - firstAngle;
    while (difference < -180) difference += 180;
    while (difference > 180) difference -= 180;
    return difference;
  },

  angleBetweenVectors: (x1, y1, x2, y2) => {
    let angle = (Math.atan2(y2, x2) - Math.atan2(y1, x1)) * (180 / Math.PI);

    if (angle > 180) { angle -= 360; } else if (angle < -180) { angle += 360; }
    return angle;
  },


  lerp: (from, to, percent) => (from * (1.0 - percent)) + (to * percent),

  lerp3d: (from, to, percent) => {
    const x = (from[0] * (1.0 - percent)) + (to[0] * percent);
    const y = (from[1] * (1.0 - percent)) + (to[1] * percent);
    const z = (from[2] * (1.0 - percent)) + (to[2] * percent);
    return [x, y, z];
  },

  lerpNd: (from, to, percent) => {
    const f = (!Array.isArray(from)) ? [from] : from;
    const t = (!Array.isArray(to)) ? [to] : to;
    if (f.length !== t.length) { return f; }
    const returnVal = [];

    for (let c = 0; c < f.length; c++) {
      returnVal.push((f[c] * (1.0 - percent)) + (t[c] * percent));
    }

    return returnVal;
  },

  deepObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      // if the current attribute is an object in the source
      if (src[key] instanceof Object && !(src[key] instanceof Array)) {
        // if the current attribute isn't in the this, or isn't an object in the this
        if (!this[key]
          || !(this[key] instanceof Object && !(this[key] instanceof Array))) {
          // make it an empty object
          this[key] = {};
        }
        // then deep merge the two
        if (key === 'specialProperties') {
          if (!this[key]) { this[key] = {}; }
          utilities.shallowObjectMerge.call(this[key], src[key]);
        } else { utilities.deepObjectMerge.call(this[key], src[key]); }
      } else {
        // if current attribute is an array in the source, give this a copy of it
        // this[key] = (Array.isArray(src[key])) ? src[key].slice() : src[key];

        // we'll worry about referencing bugs later
        this[key] = src[key];
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

  veryShallowObjectMerge(src) {
    if (!src) { return this; }
    // loop through source's attributes
    Object.keys(src).forEach((key) => {
      if (key === 'specialProperties') {
        if (!this[key]) { this[key] = {}; }
        utilities.shallowObjectMerge.call(this[key], src[key]);
        return;
      }
      // if the current attribute is an object in the source
      if (!(src[key] instanceof Object) || (src[key] instanceof Array)) {
        this[key] = src[key];
      }
    });

    return this;
  },

  shallowObjectMerge(src) {
    if (!src) { return this; }
    Object.keys(src).forEach((key) => {
      this[key] = src[key];
    });

    return this;
  },
};

module.exports = utilities;
