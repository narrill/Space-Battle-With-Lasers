const MongoClient = require('mongodb').MongoClient;

const DB_NAME = 'SpaceBattle';
const ACCOUNTS_COLLECTION_NAME = 'Accounts';

let client;
let db;
let accountsCollection;

const connect = (dbURL) => {
  return MongoClient.connect(dbURL).then((cl) => {
    client = cl;
    db = client.db(DB_NAME);
    accountsCollection = db.collection(ACCOUNTS_COLLECTION_NAME);
    accountsCollection.createIndex({ username: 1 }, { unique: true });
  });
};

const createAccount = (accData) => {
  return accountsCollection.insertOne(accData);
};

const findAccountByName = (username) => {
  return accountsCollection.findOne({ username });
};

const findAccountById = (id) => {
  return accountsCollection.findOne({ _id: id });
};

const updateAccountCurrency = (account) => {
  accountsCollection.updateOne(
    { _id: account.id }, 
    { $set: { currency: account.currency }}
  ).catch((err) => {
    console.log(err);
  });
};

const updateAccount = (account) => {
  accountsCollection.updateOne({ _id: account.id }, account.doc).catch((err) => {
    console.log(err);
  });
};

module.exports.connect = connect;