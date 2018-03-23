// Mutable vec2 with in-place operations
class Vec2Mutable {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  rotateR(theta, center = new Vec2Mutable()) {
    this.x = ((Math.cos(theta) * (this.x - center.x)) + (Math.sin(theta) * (this.y - center.y))) + center.x;
    this.y = ((Math.cos(theta) * (this.y - center.y)) - (Math.sin(theta) * (this.x - center.x))) + center.y
    return this;
  }

  rotateD(angle, center = new Vec2Mutable()) {
    return this.rotateR((Math.PI / 180) * angle, center);
  }

  distanceSqrTo(v) {
    return ((v.x - this.x) * (v.x - this.x)) + ((v.y - this.y) * (v.y - this.y));
  }

  distanceTo(v) {
    return Math.sqrt(this.distanceSqrTo(v));
  }

  normalize() {
    const magnitude = this.magnitude;
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
  }

  projectionMagnitude(v) {
    
  }

  get magnitude() {
    return Math.sqrt(this.magnitudeSqr);
  }

  get magnitudeSqr() {
    return this.dot(this);
  }

  get isZero() {
    return this.x === 0 && this.y === 0;
  }

  copy() {
    return new Vec2Mutable(this.x, this.y);
  }
}

// Immutable vec2 whose methods return copies. Serializable
class Vec2 extends Vec2Mutable {
  constructor(x = 0, y = 0) {
    super(x, y);
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale(s) {
    return new Vec2(s * this.x, s * this.y);
  }

  rotateR(theta, center = new Vec2Raw()) {
    return new Vec2(
      ((Math.cos(theta) * (this.x - center.x)) + (Math.sin(theta) * (this.y - center.y))) + center.x,
      ((Math.cos(theta) * (this.y - center.y)) - (Math.sin(theta) * (this.x - center.x))) + center.y
    );
  }

  rotateD(angle, center = new Vec2Raw()) {
    return this.rotateR((Math.PI / 180) * angle, center);
  }

  copy() {
    return new Vec2(this.x, this.y);
  }

  static deserialize({ x, y }) {
    return new Vec2(x, y);
  }

  get x() {
    return super.x;
  }

  get y() {
    return super.y;
  }  

  get normalized() {
    return this.scale(1 / this.magnitude);
  }

  // Gets the mutable base
  get mutable() {
    return super;
  }
}

Vec2.serializableProperties = [
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' }
];

module.exports = Vec2;