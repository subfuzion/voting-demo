const {Client, Pool} = require('pg');

const Backoff = require('./Backoff');
const defaults = require('./postgres_default_config');
const uuid = require('./uuid');

const eventTable = 'events';


// https://www.postgresql.org/docs/13/errcodes-appendix.html
const E_INVALID_CATALOG_NAME = "3D000"


function log(...v) {
  if (process.env.NODE_ENV === "development") {
    console.log('[postgres client]', ...v);
  }
}


class Postgres {
  /**
   * Create a new Database instance.
   * @param {object} [config] Object with valid url or uri property for connection string, or
   *                        else host, port, and database properties. Can also have an options property.
   * @throws {Error} if invalid config is provided.
   */
  constructor(config) {
    this._isConnected = false;
    this._config = Object.assign(Postgres.defaults().config(), config || {});
  }

  /**
   * Get a copy of the current config.
   * The config is an object with `host`, `port`, `db`, `user`, and `password` properties
   * @return {{}}
   */
  get config() {
    return Object.assign({}, this._config);
  }

  /**
   * Get the admin connection URL (to postgres database) based on the current config.
   * Returns value of url property if present, else returns value of uri property
   * if present, else returns generated string based on host, port, and db properties.
   * @return {string}
   */
  get adminConnectionURL() {
    let c = this.config;
    return `postgres://${c.user}:${c.password}@${c.host}:${c.port}/postgres`;
  }

  /**
   * Get the connection URL based on the current config.
   * Returns value of url property if present, else returns value of uri property
   * if present, else returns generated string based on host, port, and db properties.
   * @return {string}
   */
  get connectionURL() {
    let c = this.config;
    return `postgres://${c.user}:${c.password}@${c.host}:${c.port}/${c.database}`;
  }

  /**
   * Return true if a client connection has been established, otherwise false.
   * @return {boolean}
   */
  get isConnected() {
    return this._isConnected;
  }

  /**
   * Return the actual connected client after connecting.
   * @return {*}
   */
  get client() {
    if (!this._client) {
      checkConfig(this._config);
      this._client = new Pool({
        connectionString: this.connectionURL,
        idleTimeoutMillis: this._config.idleTimeoutMillis
      });
    }
    return this._client;
  }

  /**
   * Get a copy of the database defaults object
   * @return {{}}
   */
  static defaults() {
    return Object.assign({}, defaults);
  }

  /**
   * Creates a config object initialized with the following keys (see postgres_default_config.js)
   * then overrides default values from environment variables that map to these keys
   * - PGHOST       -> host (= postgres)
   * - PGPORT       -> port (= 5432)
   * - PGDATABASE   -> db (= votes)
   * - PGUSER       -> user (= postgres)
   * - PGPASSWORD   -> password
   *
   * then overrides with any explicit properties set by the config parameter.
   * @param {object} config, a configuration object with properties that override all else.
   * @returns {{}}
   */
  static createStdConfig(config) {
    let c = Postgres.defaults().config();

    // TODO: not recommended, use password file (https://www.postgresql.org/docs/14/libpq-pgpass.html)
    if (process.env.PGPASSWORD) c.password = process.env.PGPASSWORD
    if (process.env.PGHOST) c.host = process.env.PGHOST
    if (process.env.PGPORT) c.port = process.env.PGPORT
    if (process.env.PGDATABASE) c.database = process.env.PGDATABASE
    if (process.env.PGUSER) c.user = process.env.PGUSER

    return Object.assign(c, config || {});
  }

  async initDatabase() {
    log('Initialize database')
    let c = this.config;

    let adminClient = new Client(this.adminConnectionURL);
    log(`Connect to postgres database: ${this.adminConnectionURL}`);

    // Create database using admin connection to postgres.
    try {
      await adminClient.connect();
      await adminClient.query(`CREATE DATABASE ${c.database};`);
      await adminClient.end();
      log(`Created database: ${c.database}`)
    } catch (e) {
      log(`Failed to create database: ${c.database}`);
      throw e;
    }

    // Use connection pool to create table in newly created database.
    // TODO: change table creation to more data interesting schema
    try {
      await this.client.query(`CREATE TABLE ${eventTable}
                               (
                                  voter_id TEXT,
                                  county TEXT,
                                  state TEXT,
                                  candidate TEXT,
                                  party TEXT
                               )`);
      log(`Created table: ${eventTable}`);
    } catch (e) {
      log(`Failed to create table: ${eventTable}`);
      throw e;
    }

    log('init database success');
  }

  /**
   * Establish a connection to the database.
   * @throws {Error} Connection error.
   * @return {Promise<void>}
   */
  async connect() {
    if (this._isConnected) {
      throw new Error('Already connected');
    }

    const _connect = async () => {
      await this.client.query(`SELECT NOW()`);
      this._isConnected = true;
      log('Connected to database')
    }

    try {
      await _connect();
    } catch (e) {
      if (e.code != E_INVALID_CATALOG_NAME) {
        throw e;
      }

      await this.initDatabase();

      log('Attempting connect retry');
      await _connect();
      log('Connected to database')
    }
  }

  /**
   * Remove all rows from the `events` table.
   */
  async truncateTable() {
    log('Truncating table');
    await this.client.query(`TRUNCATE TABLE ${eventTable}`);
    log(`Truncated table ${eventTable}`)
  }

  /**
   * Clean up our database
   * @throws {Error} Connection error.
   * @return {Promise<void>}
   */
  async dropDatabase() {
    log('Drop database')

    let client = new Client(this.adminConnectionURL);
    log(`Connect to postgres database: ${this.adminConnectionURL}`);

    await client.connect();
    await client.query(`DROP DATABASE ${this.config.database};`);
    await client.end()
    log("Dropped database");
  }

  /**
   * Close the connection to the database.
   * @throws {Error} Connection error.
   * @return {Promise<void>}
   */
  async close() {
    log('Close client');
    if (this._client) {
      try {
        await this._client.end();
        log('Client closed');
      } catch (e) {
        log('Failed to close client');
        throw e;
      } finally {
        this._client = null;
        this._isConnected = false;
      }
    }
  }

  /**
   * Insert or update a vote and return the new/updated doc including voter_id property.
   * @param {object} vote Must have the following parameters:
   *  county: County the vote was filed in
   *  state: State the vote was filed in
   *  candidate: Who the vote is filed for
   *  party: 'Political affiliation' represented as a color
   *  voter_id: random hash representing our individual voter
   * @throws {Error} if vote is not valid.
   * @return vote (with generated `voter_id`)
   */
  async updateVote(vote) {
    checkVote(vote);

    if (!vote.voter_id) {
      vote.voter_id = uuid();
    }

    await this.client.query(`INSERT INTO ${eventTable} 
                            (voter_id, county, state, candidate, party)
                             VALUES ('${vote.voter_id}', '${vote.county}', '${vote.state}', '${vote.candidate}', '${vote.party}')`);
    log(`Inserted ${vote.voter_id}: ${vote.county} - ${vote.state} - ${vote.candidate} - ${vote.party}`)
    return vote;
  }

  /**
   * Get the tally of all votes grouped by candidate.
   * This tallies vote grouped by candidate and doesn't care about
   * location of votes
   * @return {Promise<{}>}
   */
  async tallyVotesByCandidate() {
    let p = this._client;
    let r = await p.query(`SELECT candidate, COUNT(voter_id)
                           FROM events
                           GROUP BY candidate`);
    let votes = {};
    for (const row in r.rows) {
      let line = r.rows[row];
      votes[line.candidate] = line.count;
    }
    return votes;
  }

  /**
   * Get the tally of all votes grouped by county.
   * @return {Promise<{}>}
   */
   async tallyVotesByCounty() {
    let p = this._client;
    let r = await p.query(`SELECT county, COUNT(voter_id)
                           FROM events
                           GROUP BY county`);
    let votes = {};
    for (const row in r.rows) {
      let line = r.rows[row];
      votes[line.county] = line.count;
    }
    return votes;
  }

  /**
   * Get the tally of all votes grouped by state.
   * @return {Promise<{}>}
   */
   async tallyVotesByState() {
    let p = this._client;
    let r = await p.query(`SELECT state, COUNT(voter_id)
                           FROM events
                           GROUP BY state`);
    let votes = {};
    for (const row in r.rows) {
      let line = r.rows[row];
      votes[line.state] = line.count;
    }
    return votes;
  }

  /**
   * Get the tally of votes for each candidate grouped by state.
   * @return {Promise<{}>}
   */
   async tallyCandidateVotesByState() {
    let p = this._client;
    let r = await p.query(`SELECT candidate, state, COUNT(voter_id) as votes
                           FROM events
                           GROUP BY state, candidate
                           ORDER BY state, votes DESC`);
    let votes = {};
    for (const row of r.rows) {
        let s = row.state;
        let c = row.candidate;
        if (!votes[s]) { votes[s] = {}; }
        votes[s][c] = row.votes
    };
    return votes;
  }


}



module.exports = Postgres;

// validate configs before accepting
function checkConfig(c) {
  let errors = [];
  if (!c.host) errors.push('missing host');
  if (!c.port) errors.push('missing port');
  if (!c.database) errors.push('missing database');
  if (!c.user) errors.push('missing user');
  if (!c.password) errors.push('missing password');

  if (c.database) {
    let name = c.database;
    if (name.replace(/[a-z0-9_]/g, '').length > 0) errors.push(`not a valid database name: ${c.database}`);
  }

  if (errors.length) {
    // don't forget to update test if the following error string is updated!
    throw new Error(`Invalid config: ${errors.join(', ')}`);
  }
}

// validate votes before accepting
function checkVote(vote) {
  let errors = [];
  if (!vote) {
    errors.push('missing vote');
  } else {
    if (!vote.county) {
      errors.push('missing county');
    }
    if (!vote.state) {
      errors.push('missing state');
    }
    if (!vote.candidate) {
      errors.push('missing candidate');
    }
    if (!vote.party) {
      errors.push('missing candidate');
    }
  }
  if (errors.length) {
    // don't forget to update test if error string is updated
    throw new Error(`Invalid vote: ${errors.join(', ')}`);
  }
}
