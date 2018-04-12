const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Binary = require('mongodb').Binary;

const DB_NAME = 'SpaceBattle';
const ACCOUNTS_COLLECTION_NAME = 'Accounts';

let client;
let db;
let accountsCollection;

const cleanMongoDocument = (doc) => {
  const cleanDoc = {};

  Object.keys(doc).forEach((key) => {
    const val = doc[key];
    if(val.toJSON)
      cleanDoc[key] = val.toJSON();
    else
      cleanDoc[key] = val;
  });

  return cleanDoc;
}

const connect = (dbURL) => {
  return MongoClient.connect(dbURL).then((cl) => {
    client = cl;
    db = client.db(DB_NAME);
    accountsCollection = db.collection(ACCOUNTS_COLLECTION_NAME);
    accountsCollection.createIndex({ username: 1 }, { unique: true });
  });
};

const createAccount = (accData) => {
  return accountsCollection.insertOne(accData).then((opDoc) => {
    return Promise.resolve(opDoc.ops[0]);
  });
};

const findAccountByUsername = (username) => {
  return accountsCollection.findOne({ username }).then((doc) => {
    return Promise.resolve(cleanMongoDocument(doc));
  });
};

const findAccountById = (id) => {
  return accountsCollection.findOne({ _id: id }).then((doc) => {
    return Promise.resolve(cleanMongoDocument(doc));
  });
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

module.exports = {
  connect,
  createAccount,
  findAccountByUsername,
  findAccountById,
  updateAccountCurrency,
  updateAccount
};