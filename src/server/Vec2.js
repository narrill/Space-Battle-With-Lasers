// Immutable vec2 whose methods return copies. Serializable
class Vec2 {
  constructor(x, y) {
    this.reset(x, y);
  }

  add(v) {
    return new Vec2(this._x + v.x, this._y + v.y);
  }

  addInPlace(v) {
    this._x += v.x;
    this._y += v.y;
    return this;
  }

  sub(v) {
    return new Vec2(this._x - v.x, this._y - v.y);
  }

  subInPlace(v) {
    this._x -= v.x;
    this._y -= v.y;
    return this;
  }

  scale(s) {
    return new Vec2(s * this._x, s * this._y);
  } 

  scaleInPlace(s) {
    this._x *= s;
    this._y *= s;
    return this;
  }

  dot(v) {
    return this._x * v.x + this._y * v.y;
  }

  rotateR(theta, center = new Vec2Raw()) {
    return new Vec2(
      ((Math.cos(theta) * (this._x - center.x)) + (Math.sin(theta) * (this._y - center.y))) + center.x,
      ((Math.cos(theta) * (this._y - center.y)) - (Math.sin(theta) * (this._x - center.x))) + center.y
    );
  }

  rotateRInPlace(theta, center = new Vec2Mutable()) {
    this._x = ((Math.cos(theta) * (this._x - center.x)) + (Math.sin(theta) * (this._y - center.y))) + center.x;
    this._y = ((Math.cos(theta) * (this._y - center.y)) - (Math.sin(theta) * (this._x - center.x))) + center.y
    return this;
  }

  rotateD(angle, center = new Vec2Raw()) {
    return this.rotateR((Math.PI / 180) * angle, center);
  }

  rotateDInPlace(angle, center = new Vec2Mutable()) {
    return this.rotateRInPlace((Math.PI / 180) * angle, center);
  }

  distanceSqrTo(v) {
    return ((v.x - this._x) * (v.x - this._x)) + ((v.y - this._y) * (v.y - this._y));
  }

  distanceTo(v) {
    return Math.sqrt(this.distanceSqrTo(v));
  } 

  normalizeInPlace() {
    const magnitude = this.magnitude;
    this._x = this._x / magnitude;
    this._y = this._y / magnitude;
  }

  copy() {
    return new Vec2(this._x, this._y);
  }

  reset(x = 0, y = 0) {
    this._x = x;
    this._y = y;

    return this;
  }

  scalarProjectionOnto(v) {
    if(this.isZero || v.isZero) return 0;

    return (this.dot(v)) / v.magnitude;
  }

  projectOnto(v) {
    if(this.isZero || v.isZero) return new Vec2();

    const dot = this.dot(v);
    return this.scale((dot * dot) / v.magnitudeSqr);
  }

  projectOntoInPlace(v) {
    if(this.isZero || v.isZero) return this.reset();

    const dot = this.dot(v);
    return this.scaleInPlace((dot * dot) / v.magnitudeSqr);
  }

  static deserialize({ x, y }) {
    return new Vec2(x, y);
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get magnitude() {
    return Math.sqrt(this.magnitudeSqr);
  }

  get magnitudeSqr() {
    return this.dot(this);
  }

  get isZero() {
    return this._x === 0 && this._y === 0;
  }

  get normalized() {
    return this.scale(1 / this.magnitude);
  }
}

Vec2.FORWARD = (new Vec2(0, -1)).freeze();

Vec2.serializableProperties = [
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' }
];

module.exports = Vec2;