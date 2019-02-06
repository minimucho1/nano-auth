import express from 'express';
import uuid from 'uuid/v4';
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());

const mongo_uri = process.env.MONGODB_URI || 'mongodb://heroku_055dnkwm:99c9oruodcs3j5vu3n0f89c922@ds127655.mlab.com:27655/heroku_055dnkwm';

const SessionStore = MongoDBStore(session);
const store = new SessionStore({
  uri: mongo_uri,
  collection: 'session'
});

store.on('error', (error) => console.log(error));

app.use(session({
  store: store,
  genid: (req) => {
    console.log('--- Session Middleware ---');
    console.log(req.sessionID);
    return uuid()
  },
  secret: 'unlucky', // replace with randomly generated string from env var
  resave: true,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.send('HIT ROOT');
});

app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  console.log(username);
  console.log(password);
  const uniqueId = uuid();
  res.send(`Generated UUID: ${uniqueId}\n`);
});

app.post('/register', (req, res) => {
  const { username = '', password = '', email = '' } = req.body;
});

app.listen(3000, () => {
  console.log('Listening on localhost:3000')
});