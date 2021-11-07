const assert = require('assert');
const Database = require('../lib/Postgres');
const { nanoid } = require('nanoid');

const TEST_TIMEOUT = 15000;


function log(...v) {
  console.log('[TEST]', ...v);
}


// Postgress database names can only be 31 characters long
// and can only have lowercase letters, numbers, and underscores.
function id() {
  let id = `test_${nanoid()}`;
  return id.slice(0, 32).toLowerCase().replace(/-/g, '_');
}

suite('database tests', function() {
  this.timeout(TEST_TIMEOUT);

  suite('basic postgres wrapper tests', () => {
    let db;

    // randomly generated database name used for testing, dropped when finished
    let dbName = id();

    suiteSetup(async () => {
      // Create a standard config and override db with generated db name
      // (a standard config overrides defaults with values from the environment and finally any explicit values)
      let config = Database.createStdConfig({ database: dbName, idleTimeoutMillis: 100 });

      try {
        db = new Database(config);
        await db.connect();
      } catch (e) {
        exit(e);
      }

      assert.equal(db.isConnected, true);
    });

    suiteTeardown(async () => {
      try {
        await db.dropDatabase();
        await db.close();
      } finally {
        assert.equal(db.isConnected, false);
      }
    });

    test('add vote to database', async () => {
      let v = {
        vote: 'a'
      };

      let doc = await db.updateVote(v);
      assert.ok(doc);
      assert.equal(doc.vote, v.vote);
      assert.ok(doc.voter_id);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('missing vote property should throw', async () => {
      // invalid vote (must have vote property)
      let v = {};

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
      let v = {
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
      let count_a = 4;
      for (let i = 0; i < count_a; i++) {
        await db.updateVote({ vote: 'a' });
      }

      let count_b = 5;
      for (let i = 0; i < count_b; i++) {
        await db.updateVote({ vote: 'b' });
      }

      let tally = await db.tallyVotes();
      assert.ok(tally);
      assert.equal(tally.a, count_a, `'a' => expected: ${count_a}, actual: ${tally.a}`);
      assert.equal(tally.b, count_b, `'b' => expected: ${count_b}, actual: ${tally.b}`);
    });

  });
});


// Print error stack starting from the caller stack frame.
// Suppress printing superfluous mocha stack frames.
function exit(e) {
  let localStack = new Error().stack;
  let e_stack = e.stack.split('\n');
  let local_stack = localStack.split('\n');
  for (let i = 0; i < local_stack.length - 3; i++) {
    e_stack.pop();
  }
  log(e_stack.join('\n'));
  process.exit(1);
}
