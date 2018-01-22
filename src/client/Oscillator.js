class Oscillator {
  constructor(periodSeconds) {
    this.start = Date.now() / 1000;
    this._period = periodSeconds;
  }
  getValue(t) {
    return Math.sin((2*Math.PI*(t+this.start))/this.period);
  }
  restart(t) {
    this.start = t;
  }
  get period() {
    return this._period;
  }
}

module.exports = Oscillator;