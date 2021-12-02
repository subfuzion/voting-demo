const Database = require('@subfuzion/vote-database').Database;
const express = require('express');
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

const port = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);

// The database connection.
let db;

// install route logging middleware
app.use(morgan());

// install json body parsing middleware
app.use(express.json());


function info(...v) {
  console.log('INFO:server:', ...v);
}

function error(...v) {
  console.log('ERROR:server:', ...v);
}


// vote route handler
app.post('/vote', async (req, res) => {
  try {
    let v = req.body
    let result = await db.updateVote(v);
    info(`posted vote: ${JSON.stringify(result)}`);
    res.send({success: true, data: result});
  } catch (err) {
    error(`ERROR: POST /vote: ${err.message || err.response || err}`);
    res.status(500).send({success: false, reason: 'internal error'});
  }
});


// results route handler
app.get('/results', async (req, res) => {
  try {
    let tally = await db.tallyVotes();
    info(`tally: ${JSON.stringify(tally)}`);
    res.send({success: true, results: tally});
  } catch (err) {
    error(`ERROR: POST /results: ${err.message || err.response || err}`);
    res.status(500).send({success: false, reason: 'internal error'});
  }
});


// metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (e) {
    res.status(500).end(e);
  }
});


app.get('/metrics/counter', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.getSingleMetricAsString('vote_received_counter'));
  } catch (e) {
    res.status(500).end(e);
  }
});


// Handle shutdown gracefully.
function handleSignal(signal) {
  info(`received ${signal}`)
  server.close(function () {
    (async () => {
      if (db) await db.close();
      info('database connection closed, exiting now');
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
    info('connected to database');

    await new Promise(resolve => {
      server.listen(port, () => {
        info(`listening on port ${port}, metrics exposed on /metrics`);
        resolve();
      });
    });

  } catch (err) {
    error(err);
    process.exit(1);
  }
})();
