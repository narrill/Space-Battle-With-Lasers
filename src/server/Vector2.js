class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  dot(v) {
    return new this.x * v.x + this.y * v.y;
  }

  scale(s) {
    return new Vec2(s * this.x, s * this.y);
  }

  rotateR(theta, center = new Vec2()) {
    return new Vec2(
      ((Math.cos(theta) * (this.x - center.x)) + (Math.sin(theta) * (this.y - center.y))) + center.x,
      ((Math.cos(theta) * (this.y - center.y)) - (Math.sin(theta) * (this.x - center.x))) + center.y
    );
  }

  rotateD(angle, center = new Vec2()) {
    return this.rotateR((Math.PI / 180) * angle, center);
  }

  distanceSqrTo(v) {
    return ((v.x - this.x) * (v.x - this.x)) + ((v.y - this.y) * (v.y - this.y));
  }

  distanceTo(v) {
    return Math.sqrt(this.distanceSqrTo(v));
  }

  get normalized() {
    return this.scale(1 / this.magnitude);
  }

  get magnitude() {
    return Math.sqrt(this.magnitudeSqr);
  }

  get magnitudeSqr() {
    return this.dot(this);
  }

  static deserialize({ x, y }) {
    return new Vec2(x, y);
  }
}

Vec2.serializableProperties = [
  { key: 'x', type: 'Float32' },
  { key: 'y', type: 'Float32' }
];

module.exports = Vec2;