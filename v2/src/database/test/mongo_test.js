import assert from "assert";
import {customAlphabet} from "nanoid";

import Database from "../lib/Mongo.js";

const TEST_TIMEOUT = 10000;

function log(...v) {
  console.log('[MONGO TEST] ', ...v);
}

// id generates valid test database names for Mongo
// https://docs.mongodb.com/manual/reference/limits/#naming-restrictions
// TODO: externalize and make more efficient
function id(prefix = 'test_') {
  const max = 63
  const punct = '-_'
  const digits = '0123456789'
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const alphabet = [punct, digits, letters, letters.toUpperCase(),].join('')
  return `${prefix}${customAlphabet(alphabet, max - prefix.length)()}`;
}


suite('database tests', function () {
  this.timeout(TEST_TIMEOUT);

  suite('basic mongo wrapper tests', () => {

    let db;

    // randomly generated database name used for testing, dropped when finished
    const dbName = id();

    setup(async () => {
      // Create a standard config and override database
      // (a standard config overrides defaults with values from the environment and finally any explicit values)
      const config = Database.createStdConfig({database: dbName});

      try {
        db = new Database(config);
        assert.equal(db.connectionURL, config.uri || `mongodb://${config.host}:${config.port}/${config.database}`);
        await db.connect();
        assert.ok(db.instance);
        assert.equal(db.instance.databaseName, config.database);
        assert.equal(db.isConnected, true);
      } catch (e) {
        exit(e);
      }
    });

    teardown(async () => {
      await db.instance.dropDatabase();
      await db.close();
      assert.equal(db.isConnected, false);
      assert.equal(db.client, null);
      assert.equal(db.instance, null);
    });

    test('add vote to database', async () => {
      const v = {
        vote: 'a'
      };

      const doc = await db.updateVote(v);
      assert.ok(doc);
      assert.equal(doc.vote, v.vote);
      assert.ok(doc.voter_id);
    });

    test('missing vote property should throw', async () => {
      // invalid vote (must have vote property)
      const v = {};

      try {
        await db.updateVote(v);
      } catch (err) {
        // expected error starts with 'Invalid vote'
        if (!err.message.startsWith('Invalid vote')) {
          // otherwise rethrow unexpected error
          throw err;
        }
      }
    });

    test('bad vote value should throw', async () => {
      // invalid value for vote (must be 'a' or 'b')
      const v = {
        vote: 'c'
      };

      try {
        await db.updateVote(v);
      } catch (err) {
        // expected error starts with 'Invalid vote'
        if (!err.message.startsWith('Invalid vote')) {
          // otherwise rethrow unexpected error
          throw err;
        }
      }
    });

    test('tally votes', async () => {
      const count_a = 4;
      for (let i = 0; i < count_a; i++) {
        await db.updateVote({vote: 'a'});
      }

      const count_b = 5;
      for (let i = 0; i < count_b; i++) {
        await db.updateVote({vote: 'b'});
      }

      const tally = await db.tallyVotes();
      assert.ok(tally);
      assert.equal(tally.a, count_a, `'a' => expected: ${count_a}, actual: ${tally.a}`);
      assert.equal(tally.b, count_b, `'b' => expected: ${count_b}, actual: ${tally.b}`);
    });

  });
});

// Print error stack starting from the caller stack frame.
// Suppress printing superfluous mocha stack frames.
function exit(e) {
  const localStack = new Error().stack;
  const e_stack = e.stack.split('\n');
  const local_stack = localStack.split('\n');
  for (let i = 0; i < local_stack.length - 3; i++) {
    e_stack.pop();
  }
  log(e_stack.join('\n'));
  process.exit(1);
}
