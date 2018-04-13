class Log {
  constructor() {
    this.amountsById = {};
  }

  log(id, amt) {
    const a = this.amountsById[id] || 0;
    this.amountsById[id] = a + amt;
  }

  publish(func, coeff = 1) {
    Object.keys(this.amountsById).forEach((id) => {
      func(id, this.amountsById[id] * coeff);
    });

    this.amountsById = {};
  }
}

module.exports = Log;
