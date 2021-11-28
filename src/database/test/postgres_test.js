const assert = require('assert');
const {customAlphabet} = require('nanoid');

const Database = require('../lib/Postgres');
const voting = require('../lib/voting');

const TEST_TIMEOUT = 15000;


function log(...v) {
  console.log('[TEST]', ...v);
}


// id generates valid test database names for Postgres
// TODO: externalize and make more efficient
function id(prefix = 'test_') {
  const max = 31
  const punct = '_'
  const digits = '0123456789'
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const alphabet = [punct, digits, letters,].join('')
  return `${prefix}${customAlphabet(alphabet, max - prefix.length)()}`;
}

suite('database tests', function () {
  this.timeout(TEST_TIMEOUT);

  suite('basic postgres wrapper tests', () => {
    let db;

    // randomly generated database name used for testing, dropped when finished
    let dbName = id();

    suiteSetup(async () => {
      // Create a standard config and override database with generated database name
      // (a standard config overrides defaults with values from the environment and finally any explicit values)
      let config = Database.createStdConfig({database: dbName, idleTimeoutMillis: 100});

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
      let v = new voting.Vote(
        new voting.Voter(null, "Alameda", "California"),
        new voting.Candidate("panther", "blue")
      );

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
      let v = new voting.Vote(
        new voting.Voter(null, "Alameda", "California")
      );

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

    test('tally votes by candidate', async () => {
      let count_a = 4;
      for (let i = 0; i < count_a; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      let count_b = 5;
      for (let i = 0; i < count_b; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByCandidate();
      assert.ok(tally);
      assert.equal(tally.get("panther"), count_a, `'panther' => expected: ${count_a}, actual: ${tally.get("panther")}`);
      assert.equal(tally.get("tiger"), count_b, `'tiger' => expected: ${count_b}, actual: ${tally.get("tiger")}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally votes by county', async () => {
      let count_marin = 2;
      for (let i = 0; i < count_marin; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Marin", "California"),
          new voting.Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      let count_alameda = 6;
      for (let i = 0; i < count_alameda; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByCounty();
      assert.ok(tally);
      assert.equal(tally.get("Marin"), count_marin, `'Marin' => expected: ${count_marin}, actual: ${tally.get("Marin")}`);
      assert.equal(tally.get("Alameda"), count_alameda, `'Alameda' => expected: ${count_alameda}, actual: ${tally.get("Alameda")}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally total votes by state', async () => {
      let count_ca = 2;
      for (let i = 0; i < count_ca; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      let count_or = 4;
      for (let i = 0; i < count_or; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Harney", "Oregon"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let count_wa = 8;
      for (let i = 0; i < count_wa; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Okanogan", "Washington"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let tally = await db.tallyVotesByState();
      assert.ok(tally);
      assert.equal(tally.get("California"), count_ca, `'California' => expected: ${count_ca}, actual: ${tally.get("California")}`);
      assert.equal(tally.get("Oregon"), count_or, `'Oregon' => expected: ${count_or}, actual: ${tally.get("Oregon")}`);
      assert.equal(tally.get("Washington"), count_wa, `'Washington' => expected: ${count_wa}, actual: ${tally.get("Washington")}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally candidate votes by state', async () => {
      let count_ca_panther = 2;
      for (let i = 0; i < count_ca_panther; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      let count_ca_lion = 1;
      for (let i = 0; i < count_ca_lion; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      let count_ca_tiger = 2;
      for (let i = 0; i < count_ca_tiger; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let count_or_tiger = 4;
      for (let i = 0; i < count_or_tiger; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Harney", "Oregon"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let count_or_lion = 1;
      for (let i = 0; i < count_or_lion; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Harney", "Oregon"),
          new voting.Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      let count_wa_tiger = 1;
      for (let i = 0; i < count_wa_tiger; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Okanogan", "Washington"),
          new voting.Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      let count_wa_panther = 1;
      for (let i = 0; i < count_wa_panther; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Okanogan", "Washington"),
          new voting.Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      let count_wa_leopard = 1;
      for (let i = 0; i < count_wa_leopard; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Okanogan", "Washington"),
          new voting.Candidate("leopard", "blue")
        );
        await db.updateVote(v);
      }

      let tally = await db.tallyCandidateVotesByState();
      assert.ok(tally);
      assert.ok(tally.get("California"))
      assert.ok(tally.get("Oregon"))
      assert.ok(tally.get("Washington"))
      assert.equal(tally.get("California").get("panther"), count_ca_panther, `'California panther' => expected: ${count_ca_panther}, actual: ${tally.get("California").get("panther")}`);
      assert.equal(tally.get("California").get("lion"), count_ca_lion, `'California lion' => expected: ${count_ca_lion}, actual: ${tally.get("California").get("lion")}`);
      assert.equal(tally.get("California").get("tiger"), count_ca_tiger, `'California tiger' => expected: ${count_ca_tiger}, actual: ${tally.get("California").get("tiger")}`);
      assert.equal(tally.get("Oregon").get("tiger"), count_or_tiger, `'Oregon tiger' => expected: ${count_or_tiger}, actual: ${tally.get("Oregon").get("tiger")}`);
      assert.equal(tally.get("Oregon").get("lion"), count_or_lion, `'Oregon lion' => expected: ${count_or_lion}, actual: ${tally.get("Oregon").get("lion")}`);
      assert.equal(tally.get("Washington").get("tiger"), count_wa_tiger, `'Washington tiger' => expected: ${count_wa_tiger}, actual: ${tally.get("Washington").get("tiger")}`);
      assert.equal(tally.get("Washington").get("panther"), count_wa_panther, `'Washington panther' => expected: ${count_wa_panther}, actual: ${tally.get("Washington").get("panther")}`);
      assert.equal(tally.get("Washington").get("leopard"), count_wa_leopard, `'Washington leopard' => expected: ${count_wa_leopard}, actual: ${tally.get("Washington").get("leopard")}`);
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
