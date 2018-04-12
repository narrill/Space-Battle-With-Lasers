const crypto = require('crypto');
const db = require('../db.js');
const accountStore = require('../accountStore.js');

const iterations = 10000;
const saltLength = 64;
const keyLength = 64;

class Account {
  constructor(doc) {
    this.doc = doc;
  }

  // Attempts to access the account matching the
  // given username and password. Returns a promise
  // that resolves to the matching account if it
  // exists and validates and rejects if a matching
  // account couldn't be found or validated
  static load(username, password) {    
    // Try to get from account store
    const acc = accountStore.getByUsername(username);
    if(acc)
      return acc._validatePassword(password).then(() => {
        return Promise.resolve(acc);
      });

    return db.findAccountByUsername(username).then((doc) => {
      const account = new Account(doc);
      return account._validatePassword(password);
    }).then(() => {
      accountStore.addAccount(account);
      return Promise.resolve(account);
    });
  }

  // Attempts to create an account. Adds the account
  // to the database and account store, returning a
  // promise that resolves to the resulting account.
  static create(username, password) {
    return Account._generateHash(password).then((salt, hash) => {
      const accData = {
        username,
        salt,
        hash,
        currency: 0
      };
      return db.createAccount(accData);
    }).then((doc) => {
      const acc = new Account(doc);
      accountStore.addAccount(acc);
      return Promise.resolve(new AccountView(acc));
    });
  }

  static _generateHash(password, callback) {
    const salt = crypto.randomBytes(saltLength);

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) =>
        resolve(salt, hash.toString('hex'))
      );
    });
  }

  _validatePassword(password) {
    const {salt, pass} = this.doc;

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
        if(hash.toString('hex') === pass)
          reject();
        else
          resolve();
      });
    });
  }

  get id() {
    return this.doc._id;
  }

  get username() {
    return this.doc.username;
  }

  trySubtract(amt) {
    if(this.doc.currency >= amt) {
      this.doc.currency -= amt;
      return true;
    }
    else
      return false;
  }

  saveCurrency() {
    db.updateAccountCurrency(this);
  }

  save() {
    db.updateAccount(this);
  }
}

module.exports = Account;
