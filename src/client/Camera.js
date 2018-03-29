const utilities = require('../server/utilities.js');
const Viewport = require('./Viewport.js');

class Camera {
  constructor(canvas, objectParams = {}) {
    this.x = (objectParams.x) ? objectParams.x : 0;
    this.y = (objectParams.y) ? objectParams.y : 0;
    this.rotation = (objectParams.rotation) ? objectParams.rotation : 0;
    this.zoom =  (objectParams.zoom) ? objectParams.zoom : 1;
    this.minZoom = (objectParams.minZoom)?objectParams.minZoom:.2;
    this.maxZoom = (objectParams.maxZoom)?objectParams.maxZoom:Number.MAX_VALUE;
    this.viewport = new Viewport(objectParams.viewport);
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  get width(){
    return this.canvas.width;
  }

  get height(){
    return this.canvas.height;
  }

  worldPointToCameraSpace (xw, yw, zw = 0) {
    const zoom = 1 / (1 / this.zoom + zw);
    var cameraToPointVector = [(xw - this.x) * zoom, (yw - this.y) * zoom];
    var rotatedVector = utilities.rotate(0, 0, cameraToPointVector[0], cameraToPointVector[1], this.rotation);
    return [this.width / 2 + rotatedVector[0], this.height / 2 + rotatedVector[1]];
  }
}

module.exports = Camera;