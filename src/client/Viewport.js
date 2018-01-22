class Viewport {
  constructor(objectParams = {}) {
    this.startX = (objectParams.startX) ? objectParams.startX : 0;
    this.startY = (objectParams.startY) ? objectParams.startY : 0;
    this.endX = (objectParams.endX) ? objectParams.endX : 1;
    this.endY = (objectParams.endY) ? objectParams.endY : 1;
    this.parent = objectParams.parent;
  }
}

module.exports = Viewport;