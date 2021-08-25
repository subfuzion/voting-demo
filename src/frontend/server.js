const Database = require('@subfuzion/database').Database;
const express= require('express');
const http = require('http');
const morgan = require('morgan');

// Create a database connection config object initialized with the defaults:
// { "host": "database", "port": 27017 },
// then overridden by any environment variables, then finally overridden by any
// explicit props set by the supplied config object.
// For environment variables, first check for DATABASE_URI and set "uri"
// property, then check for DATABASE_HOST and DATABASE_PORT and set the "host"
// and "port" properties.
const databaseConfig = Database.createStdConfig();

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// The database connection.
let db;

// install route logging middleware
app.use(morgan('dev'));

// install json body parsing middleware
app.use(express.json());

// vote route handler
app.post('/vote', async (req, res) => {
  try {
    console.log('POST /vote: %j', req.body);
    let v = { vote: req.body.vote };
    let result = await db.updateVote(v);
    console.log('posted vote: %j', result);
    res.send({ success: true, data: result });
  } catch (err) {
    console.log('ERROR: POST /vote: %s', err.message || err.response || err);
    res.status(500).send({ success: false, reason: 'internal error' });
  }
});

// results route handler
app.get('/results', async (req, res) => {
  try {
    console.log('GET /results');
    let tally = await db.tallyVotes();
    console.log('resp: %j', tally);
    res.send({ success: true, results: tally});
  } catch (err) {
    console.log('ERROR: POST /results: %s', err.message || err.response || err);
    res.status(500).send({ success: false, reason: 'internal error' });
  }
});

// Handle shutdown gracefully.
function handleSignal(signal) {
  console.log(`frontend received ${signal}`)
  server.close(function () {
    (async () => {
      if (db) await db.close();
      console.log('frontend database connection closed, exiting now');
      process.exit(0);
    })();
  });
}
process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);

// initialize and start running
(async () => {
  try {
    db = new Database(databaseConfig);
    await db.connect();
    console.log('frontend connected to database');

    await new Promise(resolve => {
      server.listen(port, () => {
        console.log(`frontend listening on port ${port}`);
        resolve();
      });
    });

  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();