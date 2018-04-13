const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const DB_NAME = process.env.DB_NAME || 'SpaceBattle';
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
    if (val.toJSON) { cleanDoc[key] = val.toJSON(); } else { cleanDoc[key] = val; }
  });

  return cleanDoc;
};

const connect = dbURL => MongoClient.connect(dbURL).then((cl) => {
  client = cl;
  db = client.db(DB_NAME);
  accountsCollection = db.collection(ACCOUNTS_COLLECTION_NAME);
  accountsCollection.createIndex({ username: 1 }, { unique: true });
  bpCollection = db.collection(BP_COLLECTION_NAME);
});

const createAccount = accData =>
  accountsCollection.insertOne(accData).then(opDoc => Promise.resolve(opDoc.ops[0]));

const findAccountByUsername = username =>
  accountsCollection.findOne({ username }).then(doc => Promise.resolve(cleanMongoDocument(doc)));

const findAccountById = id =>
  accountsCollection.findOne({ _id: id }).then(doc => Promise.resolve(cleanMongoDocument(doc)));

const findBPsByAccount = acc =>
  bpCollection.find({ account: acc.id }).toArray();

const updateAccountCurrency = account =>
  accountsCollection.updateOne(
    { _id: ObjectID(account.id) },
    { $set: { currency: account.currency } },
  ).catch((err) => {
    console.log(err);
  });

const updateAccount = account =>
  accountsCollection.updateOne({ _id: ObjectID(account.id) }, account.doc).catch((err) => {
    console.log(err);
  });

const submitBP = doc => bpCollection.update({ name: doc.name }, doc, { upsert: true });

module.exports = {
  connect,
  createAccount,
  findAccountByUsername,
  findAccountById,
  updateAccountCurrency,
  updateAccount,
  findBPsByAccount,
  submitBP,
};
