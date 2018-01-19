class TitleScreen {
  constructor(client) {
    this.client = client;
  }

  update(dt) {
  }

  draw(now, dt) {
    const camera = this.client.camera;
    const nowS = now / 1000;
    camera.x = titleCameraOsc.getValue(nowS) * 100000;
    camera.y = titleCameraOsc.getValue(nowS + titleCameraOsc.period/4) * 100000;
    camera.rotation = utilities.correctOrientation(camera.rotation + .1 * dt);
    drawing.drawTitleScreen(camera, titleOsc);
  }

  keyHandler(e) {
    if(!e.repeat)
      playStinger(keyclick);
    if(e.keyCode === this.client.myKeys.KEYBOARD.KEY_ENTER) {
      this.client.switchScreen(this.client.chooseShipScreen);
    }
  }

  onExit() {
    playStinger(titleStinger);
  }
}