// to-do: write express-session-compatible session store
// Singleton, so we can access the store from arbitrary
// parts of the codebase (mostly the Account model).
// Sessions should be kept alive by touches from the
// socket heartbeat and any active AIs, and will expire
// only once the socket is down, no AIs are left, and
// the expiry time has elapsed.

const BaseStore = require('express-session').Store;

class SessionWrapper {
  constructor(session) {
    this._session = session;
    this._lastTouch = Date.now();
  }

  get age() {
    return Date.now() - this._lastTouch;
  }

  get session() {
    return this._session;
  }

  update(session) {
    this._session = session;
    this.touch();
  }

  touch() {
    this._lastTouch = Date.now();
  }
}

class AccountStore extends BaseStore {
  constructor(options = {}) {
    super(options);

    this.sessionsBySid = {};
    this.accountsById = {};
    this.accountsByUsername = {};

    this.checkPeriod = options.checkPeriod || 300000; // 5 minutes
    this.maxAge = options.maxAge || 3600000; // 1 hour

    this.pruneInterval = setInterval(this._prune.bind(this), this.checkPeriod);
  }

  addAccount(acc) {
    this.accountsById[acc.id] = acc;
    this.accountsByUsername[acc.username] = acc;
  }

  removeAccount(acc) {
    delete this.accountsById[acc.id];
    delete this.accountsByUsername[acc.username];
  }

  getAccountByUsername(username) {
    return this.accountsByUsername[username];
  }

  get(sid, callback) {
    callback(null, this.sessionsBySid[sid]);
  }

  set(sid, session, callback) {
    const wrapper = this.sessionsBySid[sid];
    if(wrapper)
      wrapper.update(session);
    else
      this.sessionsBySid[sid] = new SessionWrapper(session);

    callback(null);
  }

  destroy(sid, callback) {
    // For now, remove accounts when the associated
    // session is pruned
    const wrapper = this.sessionsBySid[sid];
    if(wrapper && wrapper.session.account) 
      this.removeAccount(wrapper.session.account);
    delete this.sessionsBySid[sid];

    if(callback) callback(null);
  }

  touch(sid, session, callback) {
    const wrapper = this.sessionsBySid[sid];
    if(wrapper) {
      wrapper.touch();
      callback(null);
    }
    else
      callback(new Error("Session not found"));
  }

  _prune() {
    Object.keys(this.sessionsBySid).forEach((sid) => {
      const wrapper = this.sessionsBySid[sid];
      if(wrapper.age >= this.maxAge)
        this.destroy(sid);
    });
  }
}

const accountStore = new AccountStore();

module.exports = accountStore;