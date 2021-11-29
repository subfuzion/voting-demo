import express from 'express';
import http from "http";
import metrics from "prom-client";
import morgan from "morgan";

import Database from "@subfuzion/vote-database/Postgres";
import * as voting from "@subfuzion/vote-database/voting";


// Enable default prometheus-compatible metrics collection
const register = metrics.register;
metrics.collectDefaultMetrics();
console.log(`Collecting metrics for ${metrics.collectDefaultMetrics.metricsList}`);
const voteCounter = new metrics.Counter({
  name: 'vote_received_counter', help: 'Number of vote requests received',
});


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
app.use(morgan('common'));

// install json body parsing middleware
app.use(express.json());


function info(...v) {
  console.log('INFO:server:', ...v);
}

function error(...v) {
  console.log('ERROR:server:', ...v);
}


// for healthchecks
app.head("/",(req,res)=>{
  res.sendStatus(200);
})


// vote route handler
app.post('/vote', async (req, res) => {
  try {
    voteCounter.inc();
    let v = req.body
    let vote = new voting.Vote(
      new voting.Voter(null, v.voter.county, v.voter.state),
      new voting.Candidate(v.candidate.name, v.candidate.party)
    );
    let result = await db.updateVote(vote);
    info(`posted vote: ${JSON.stringify(result)}`);
    res.send({success: true, data: result});
  } catch (err) {
    error(`ERROR: POST /vote: ${err.message || err.response || err}`);
    res.status(500).send({success: false, reason: 'internal error'});
  }
});


// tally route handler
app.get('/tally/candidates', async (req, res) => {
  try {
    const result = await db.tallyVotesByCandidate();
    const tally = result.candidateTallies;
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
