const { Client } = require('pg');

const Backoff = require('./Backoff');
const defaults = require('./postgres_default_config');
const uuid = require('./uuid');

class Postgres {
  /**
   * Create a new Database instance.
   * @param {object} [config] Object with valid url or uri property for connection string, or
   *                        else host, port, and db properties. Can also have an options property.
   * @throws {Error} if invalid config is provided.
   */
  constructor(config) {
    this._client = null;
    this._isConnected = false;
    this._config = Object.assign(Postgres.defaults().config(), config || {});
    checkConfig(this._config);
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

    if (process.env.PGHOST) c.host = process.env.PGHOST
    if (process.env.PGPORT) c.port = process.env.PGPORT
    if (process.env.PGDATABASE) c.db = process.env.PGDATABASE
    if (process.env.PGUSER) c.user = process.env.PGUSER
    // TODO: not recommended, use password file (https://www.postgresql.org/docs/14/libpq-pgpass.html)
    if (process.env.PGPASSWORD) c.password = process.env.PGPASSWORD

    return Object.assign(c, config || {});
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
   * Get the connection URL based on the current config.
   * Returns value of url property if present, else returns value of uri property
   * if present, else returns generated string based on host, port, and db properties.
   * @return {string}
   */
  get connectionURL() {
    let c = this.config;
    // sanitize password
    let pw = c.password.replace(/./g, '#');
    return `postgres://${c.user}:${pw}@${c.host}:${c.port}:${c.db}`
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
    return this._client;
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

    let that = this;
    let backoff = new Backoff(async () => {
      let client = new Client(that.connectionURL);
      console.error(that.connectionURL)
      that._client = await client.connect();
      that._isConnected = true;
    });

    await backoff.connect();
  }

  /**
   * Close the connection to the database.
   * @throws {Error} Connection error.
   * @return {Promise<void>}
   */
  async close() {
    if (this._client) {
      await this._client.close();
      this._client = null;
    }
    this._isConnected = false;
  }

  /**
   * Insert or update a vote and return the new/updated doc including voter_id property.
   * @param {object} vote Must have a vote property set to either 'a' or 'b'.
   * @throws {Error} if vote is not valid.
   * @return vote (with generated `voter_id`)
   */
  async updateVote(vote) {
    if (!this.isConnected) {
      throw new Error('Not connected to database');
    }

    checkVote(vote);

    if (!vote.voter_id) {
      vote.voter_id = uuid();
    }

    // TODO

    return vote;
  }

  /**
   * Get the tally of all 'a' and 'b' votes.
   * @return {Promise<{a: number, b: number}>}
   */
  async tallyVotes() {
    // TODO
    return {
      a: 0,
      b: 0
    };
  }

}

module.exports = Postgres;

// validate configs before accepting
function checkConfig(c) {
  let errors = [];
  if (!c.host) errors.push('host');
  if (!c.port) errors.push('port');
  if (!c.db) errors.push('db');
  if (!c.user) errors.push('user');
  if (!c.password) errors.push('password');

  if (errors.length) {
    // don't forget to update test if the following error string is updated!
    throw new Error(`Invalid config. Provide valid values for the following: ${errors.join(', ')}`);
  }
}

// validate votes before accepting
function checkVote(vote) {
  let errors = [];
  if (!vote) {
    errors.push('missing vote');
  } else {
    if (!vote.vote) {
      errors.push('missing vote property');
    } else {
      if (vote.vote !== 'a' && vote.vote !== 'b') {
        errors.push('invalid value for vote: (must be "a" or "b")');
      }
    }
  }
  if (errors.length) {
    // don't forget to update test if error string is updated
    throw new Error(`Invalid vote: ${errors.join(', ')}`);
  }
}
