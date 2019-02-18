import express from 'express';
import uuid from 'uuid/v4';
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';

const app = express();

app.use(bodyParser.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://heroku_055dnkwm:99c9oruodcs3j5vu3n0f89c922@ds127655.mlab.com:27655/heroku_055dnkwm';

const SessionStore = MongoDBStore(session);
const store = new SessionStore({
  uri: mongoUri,
  collection: 'session',
});

store.on('error', error => console.log(error));

let db = null;

app.use(session({
  store,
  genid: (req) => {
    console.log('--- Session Middleware ---');
    console.log(req.sessionID);
    return uuid();
  },
  secret: 'unlucky', // replace with randomly generated string from env var
  resave: true,
  saveUninitialized: true,
}));

app.get('/', (req, res) => {
  res.send('HIT ROOT');
});

const isCorrectPassword = (givenPassword, dbPassword) => new Promise((resolve, reject) => {
  bcrypt.compare(givenPassword, dbPassword)
    .then((res) => {
      if (res) {
        console.log('Correct password.');
        resolve(true);
      } else {
        console.log('Invalid password. Try again');
        resolve(false);
      }
    })
    .catch((err) => {
      console.log('Something went wrong.');
      reject(err);
    });
});

const hasAccountEntry = (dbClient, query) => new Promise((resolve, reject) => {
  dbClient.collection('accounts').find(query).toArray()
    .then((entries) => {
      if (entries.length && entries.length === 1) {
        resolve(entries[0]);
      } else if (entries.length > 1) {
        reject(new Error('Found more than one matching account in database.'));
      } else {
        reject(new Error('Account not found'));
      }
    })
    .catch((err) => {
      reject(err);
    });
});

app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  const query = { username };
  const loginPromise = hasAccountEntry(db, query)
    .then((entry) => {
      console.log('Entry: ', entry);
      return isCorrectPassword(password, entry.password);
    })
    .then(loginSuccess => loginSuccess)
    .catch((err) => { throw err; });

  Promise.all([loginPromise])
    .then((results) => {
      if (results[0]) {
        res.send('Login Successful');
      } else {
        res.send('Unsuccessful Login');
      }
    })
    .catch((err) => { throw err; });
});

app.post('/register', (req, res) => {
  res.send('Not yet available');
});


MongoClient.connect(mongoUri)
  .then((client) => {
    db = client.db('heroku_055dnkwm');
    app.listen(3000, () => {
      console.log('Listening on localhost:3000');
    });
  })
  .catch((err) => {
    throw err;
  });
