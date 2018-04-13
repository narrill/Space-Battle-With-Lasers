const crypto = require('crypto');
const util = require('util');
const db = require('../db.js');
const accountStore = require('../accountStore.js');
const objBlueprints = require('../objBlueprints.js');

const iterations = 10000;
const saltLength = 64;
const keyLength = 64;
const MAX_BPS = 5;

class Account {
  constructor(doc) {
    this.doc = doc;
    this.isDirtyCurrency = false;
    this.isDirty = false;
    this.bpsByName = {};
  }

  // Attempts to access the account matching the
  // given username and password. Returns a promise
  // that resolves to the matching account if it
  // exists and validates and rejects if a matching
  // account couldn't be found or validated
  static load(username, password) {    
    // Try to get from account store
    let acc = accountStore.getAccountByUsername(username);
    if(acc) {
      return acc._validatePassword(password).then(() => {
        return Promise.resolve(acc);
      });
    }

    return db.findAccountByUsername(username).then((doc) => {
      acc = new Account(doc);
      return acc._validatePassword(password);
    }).then(() => {
      return db.findBPsByAccount(acc);
    }).then((bpDocs) => {
      for(let c = 0; c < bpDocs.length; ++c) {
        const processedBP = objBlueprints.processShip(bpDocs[c].bp);
        acc.bpsByName[bpDocs[c].name] = processedBP;
      }
      accountStore.addAccount(acc);
      return Promise.resolve(acc);
    });
  }

  // Attempts to create an account. Adds the account
  // to the database and account store, returning a
  // promise that resolves to the resulting account.
  static create(username, password) {
    return Account._generateHash(password).then(({ salt, pass }) => {
      const accData = {
        username,
        salt,
        pass,
        currency: 0
      };
      return db.createAccount(accData);
    }).then((doc) => {
      const acc = new Account(doc);
      accountStore.addAccount(acc);
      return Promise.resolve(acc);
    });
  }

  static _generateHash(password) {
    const salt = crypto.randomBytes(saltLength).toString('hex');

    return util.promisify(crypto.pbkdf2)(
      password, 
      salt, 
      iterations, 
      keyLength, 
      'RSA-SHA512'
    ).then((hash) => {
      return Promise.resolve({ salt, pass: hash.toString('hex')});
    });
  }

  _validatePassword(password) {
    const {salt, pass} = this.doc;

    return util.promisify(crypto.pbkdf2)(
      password, 
      salt, 
      iterations, 
      keyLength, 
      'RSA-SHA512'
    ).catch((err) => {
      console.log(err);
    }).then((hash) => {
      const hstring = hash.toString('hex');
      if(hstring === pass)
        return Promise.resolve();
      else
        return Promise.reject();
    });
  }

  get id() {
    return this.doc._id;
  }

  get username() {
    return this.doc.username;
  }

  get currency() {
    return this.doc.currency;
  }

  get bpCount() {
    return Object.keys(this.bps).length;
  }

  get bpNamesAndCosts() {
    const o = {};

    Object.keys(this.bpsByName).forEach((name) => {
      o[name] = this.bpsByName[name].buyCost;
    });

    return o;
  }

  submitBP(bpInfo) {
    const bpDoc = {
      name: bpInfo.name,
      bp: bpInfo.bp,
      account: this.id
    };

    return db.submitBP(bpDoc).then(() => {
      const processedBP = objBlueprints.processShip(bpDoc.bp);
      this.bpsByName[bpDoc.name] = processedBP;
      return Promise.resolve(processedBP.buyCost);
    });
  }

  getBP(name) {
    return this.bpsByName[name];
  }

  attachSocket(s) {
    accountStore.attachSocket(s, this.id);
  }

  trySubtract(amt) {
    if(this.doc.currency >= amt) {
      this.doc.currency -= amt;
      this.isDirtyCurrency = true;
      return true;
    }
    else
      return false;
  }

  addCurrency(amt) {
    this.doc.currency += amt;
    this.isDirtyCurrency = true;
  }

  emitCurrency() {
    const socket = accountStore.getSocketForAccount(this);
    if(socket && socket.connected)
      socket.emit('currency', this.doc.currency);
  }

  save() {
    if(this.isDirty)
      db.updateAccount(this).then(() => {
        this.isDirty = false;
        this.isDirtyCurrency = false;
        this.emitCurrency();
      });
    else if(this.isDirtyCurrency)
      db.updateAccountCurrency(this).then(() => {
        this.isDirtyCurrency = false;
        this.emitCurrency();
      });
  }
}

module.exports = Account;
