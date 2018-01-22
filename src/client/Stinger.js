class Stinger {
  constructor(id) {
    this.elem = document.querySelector(`#${id}`);
  }

  play() {
    this.elem.currentTime = 0;
    this.elem.play();
  }
}

module.exports = Stinger;