const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Binary = require('mongodb').Binary;

const DB_NAME = 'SpaceBattle';
const ACCOUNTS_COLLECTION_NAME = 'Accounts';
const BP_COLLECTION_NAME = 'BPs';

let client;
let db;
let accountsCollection;
let bpCollection;

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
    bpCollection = db.collection(BP_COLLECTION_NAME);
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

const findBPsByAccount = (acc) => {
  return bpCollection.find({ account: acc.id }).toArray();
};

const updateAccountCurrency = (account) => {
  return accountsCollection.updateOne(
    { _id: ObjectID(account.id) }, 
    { $set: { currency: account.currency }}
  ).catch((err) => {
    console.log(err);
  });
};

const updateAccount = (account) => {
  return accountsCollection.updateOne({ _id: ObjectID(account.id) }, account.doc).catch((err) => {
    console.log(err);
  });
};

const submitBP = (doc) => {
  return bpCollection.update({ name: doc.name }, doc, { upsert: true });
}

module.exports = {
  connect,
  createAccount,
  findAccountByUsername,
  findAccountById,
  updateAccountCurrency,
  updateAccount,
  findBPsByAccount,
  submitBP
};