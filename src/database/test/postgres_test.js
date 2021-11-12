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
        county: 'Alameda',
        state: 'California',
        party: 'blue',
        candidate: 'panther'
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
/* This vote no longer applies since we're letting things be open
 * for now. If we want to limit 'candidates' to a fixed list we
 * can do that as well with some pre-filled data in a table that
 * we draw from that's set up with the database

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
*/
    test('tally votes by candidate', async () => {
      let count_a = 4;
      for (let i = 0; i < count_a; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'panther'
        };
        await db.updateVote(v);
      }

      let count_b = 5;
      for (let i = 0; i < count_b; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByCandidate();
      assert.ok(tally);
      assert.equal(tally.panther, count_a, `'panther' => expected: ${count_a}, actual: ${tally.panther}`);
      assert.equal(tally.tiger, count_b, `'tiger' => expected: ${count_b}, actual: ${tally.tiger}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally votes by county', async () => {
      let count_marin = 2;
      for (let i = 0; i < count_marin; i++) {
        let v = {
          county: 'Marin',
          state: 'California',
          party: 'blue',
          candidate: 'lion'
        };
        await db.updateVote(v);
      }

      let count_alameda = 6;
      for (let i = 0; i < count_alameda; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByCounty();
      assert.ok(tally);
      assert.equal(tally.Marin, count_marin, `'Marin' => expected: ${count_marin}, actual: ${tally.Marin}`);
      assert.equal(tally.Alameda, count_alameda, `'Alameda' => expected: ${count_alameda}, actual: ${tally.Alameda}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally total votes by state', async () => {
      let count_ca = 2;
      for (let i = 0; i < count_ca; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'panther'
        };
        await db.updateVote(v);
      }

      let count_or = 4;
      for (let i = 0; i < count_or; i++) {
        let v = {
          county: 'Harney',
          state: 'Oregon',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let count_wa = 8;
      for (let i = 0; i < count_wa; i++) {
        let v = {
          county: 'Okanogan',
          state: 'Washington',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByState();
      assert.ok(tally);
      assert.equal(tally.California, count_ca, `'California' => expected: ${count_ca}, actual: ${tally.california}`);
      assert.equal(tally.Oregon, count_or, `'Oregon' => expected: ${count_or}, actual: ${tally.oregon}`);
      assert.equal(tally.Washington, count_wa, `'Washington' => expected: ${count_wa}, actual: ${tally.washington}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally candidate votes by state', async () => {
      let count_ca_panther = 2;
      for (let i = 0; i < count_ca_panther; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'panther'
        };
        await db.updateVote(v);
      }

      let count_ca_lion = 1;
      for (let i = 0; i < count_ca_lion; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'lion'
        };
        await db.updateVote(v);
      }

      let count_ca_tiger = 2;
      for (let i = 0; i < count_ca_tiger; i++) {
        let v = {
          county: 'Alameda',
          state: 'California',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let count_or_tiger = 4;
      for (let i = 0; i < count_or_tiger; i++) {
        let v = {
          county: 'Harney',
          state: 'Oregon',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let count_or_lion = 1;
      for (let i = 0; i < count_or_lion; i++) {
        let v = {
          county: 'Harney',
          state: 'Oregon',
          party: 'blue',
          candidate: 'lion'
        };
        await db.updateVote(v);
      }

      let count_wa_tiger = 1;
      for (let i = 0; i < count_wa_tiger; i++) {
        let v = {
          county: 'Okanogan',
          state: 'Washington',
          party: 'blue',
          candidate: 'tiger'
        };
        await db.updateVote(v);
      }

      let count_wa_panther = 1;
      for (let i = 0; i < count_wa_panther; i++) {
        let v = {
          county: 'Okanogan',
          state: 'Washington',
          party: 'blue',
          candidate: 'panther'
        };
        await db.updateVote(v);
      }

      let count_wa_leopard = 1;
      for (let i = 0; i < count_wa_leopard; i++) {
        let v = {
          county: 'Okanogan',
          state: 'Washington',
          party: 'blue',
          candidate: 'leopard'
        };
        await db.updateVote(v);
      }

      let tally = await db.tallyCandidateVotesByState();
      assert.ok(tally);
      assert.ok(tally.California)
      assert.ok(tally.Oregon)
      assert.ok(tally.Washington)
      assert.equal(tally.California.panther, count_ca_panther, `'California panther' => expected: ${count_ca_panther}, actual: ${tally.California.panther}`);
      assert.equal(tally.California.lion, count_ca_lion, `'California lion' => expected: ${count_ca_lion}, actual: ${tally.California.lion}`);
      assert.equal(tally.California.tiger, count_ca_tiger, `'California tiger' => expected: ${count_ca_tiger}, actual: ${tally.California.tiger}`);
      assert.equal(tally.Oregon.tiger, count_or_tiger, `'Oregon tiger' => expected: ${count_or_tiger}, actual: ${tally.Oregon_tiger}`);
      assert.equal(tally.Oregon.lion, count_or_lion, `'Oregon lion' => expected: ${count_or_lion}, actual: ${tally.Oregon_lion}`);
      assert.equal(tally.Washington.tiger, count_wa_tiger, `'Washington tiger' => expected: ${count_wa_tiger}, actual: ${tally.Washington.tiger}`);
      assert.equal(tally.Washington.panther, count_wa_panther, `'Washington panther' => expected: ${count_wa_panther}, actual: ${tally.Washington.panther}`);
      assert.equal(tally.Washington.leopard, count_wa_leopard, `'Washington leopard' => expected: ${count_wa_leopard}, actual: ${tally.Washington.leopard}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
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
