class LooseTimer {
  constructor(intervalMS, func) {
    this.interval = intervalMS;
    this.lastTick = 0;
    this.func = func;
  }
  check(now = Date.now().valueOf()) {
    const diffTicks = (now - this.lastTick) / this.interval;
    if(diffTicks >= 1) {
      this.lastTick += this.interval * Math.floor(diffTicks);
      this.func();
    }
  }
}

module.exports = LooseTimer;