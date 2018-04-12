const crypto = require('crypto');
const util = require('util');
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

    // return new Promise((resolve, reject) => {
    //   crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    //     resolve({salt, pass: hash.toString('hex')});
    //   });
    // });
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

    // console.log(password);
    // return new Promise((resolve, reject) => {
    //   console.log('really validating');
    //   crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    //     console.log('in validation');
    //     console.log(hash.toString('hex'));
    //     console.log(pass);
    //     if(hash.toString('hex') === pass)
    //       resolve();
    //     else
    //       reject();
    //   });
    // });
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
