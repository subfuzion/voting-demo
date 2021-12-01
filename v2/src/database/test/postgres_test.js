import assert from "assert";
import {customAlphabet} from "nanoid";

import {default as Database} from "../lib/Postgres.js";
import {
  Candidate,
  TallyCandidateVotesByStateResult,
  TallyVotesByCandidateResult,
  TallyVotesByCountyResult,
  TallyVotesByStateResult,
  Vote,
  Voter
} from "../lib/voting.js";

const TEST_TIMEOUT = 1000 * 15;

function log(...v) {
  console.log('[POSTGRES TEST]', ...v);
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

// minify the JSON string by removing all extraneous whitespace.
function minify(jsonStr) {
  return jsonStr.replace(/\s/g, '');
}

suite('database tests', function () {
  this.timeout(TEST_TIMEOUT);

  suite('serialization tests', function () {

    test('Candidate serialization #1', function () {
      const v1 = new Candidate("panther", "blue");
      const s1 = JSON.stringify(v1);
      const v2 = Candidate.fromJSON(s1);
      const s2 = JSON.stringify(v2);
      assert.equal(s2, s1)
    });

    test('Candidate serialization #2', function () {
      const s1 = minify(`
      {
        "name": "panther",
        "party": "blue"
      }`);
      const v2 = new Candidate("panther", "blue");
      const s2 = JSON.stringify(v2);
      assert.equal(s2, s1);
    });

    test('Voter serialization #1', function () {
      const v1 = new Voter(
        "4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
        "Alameda",
        "California"
      );
      const s1 = JSON.stringify(v1);
      const v2 = Voter.fromJSON(s1);
      const s2 = JSON.stringify(v2);
      assert.equal(s2, s1)
    });

    test('Voter serialization #2', function () {
      const s1 = minify(`{
        "voter_id": "4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
        "county": "Alameda",
        "state": "California"
      }`);
      const v2 = new Voter(
        "4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
        "Alameda",
        "California"
      );
      const s2 = JSON.stringify(v2);
      assert.equal(s2, s1)
    });

    test('Vote serialization #1', function () {
      const v1 = new Vote(
        new Voter("4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
          "Alameda", "California"),
        new Candidate("panther", "blue")
      );

      let s1 = JSON.stringify(v1);
      let v2 = Vote.fromJSON(s1);
      let s2 = JSON.stringify(v2);
      assert.equal(s2, s1)
    });

    test('Vote serialization #2', function () {
      let s1 = minify(`{
        "voter": {
          "voter_id": "4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
          "county": "Alameda",
          "state": "California"
        },
        "candidate": {
          "name": "panther",
          "party": "blue"
        }
      }`);
      const v2 = new Vote(
        new Voter("4caa67b4-f211-4d22-a7b1-808fd21a6bf6",
          "Alameda", "California"),
        new Candidate("panther", "blue")
      );
      let s2 = JSON.stringify(v2);
      assert.equal(s2, s1)
    });

    test('tally by candidate serialization', function () {
      const s1 = minify(`
      {
        "candidateTallies": {
          "panther": {
            "name": "panther",
            "votes": 4
          },
          "tiger": {
            "name": "tiger",
            "votes": 5
          }
        }
      }`);
      const v1 = TallyVotesByCandidateResult.fromJSON(s1);
      const s2 = JSON.stringify(v1);
      assert.equal(s2, s1);
    });

    test('tally by county serialization', function () {
      const s1 = minify(`
      {
        "countyTallies": {
          "Marin": {
            "name": "Marin",
            "votes": 2
          },
          "Alameda": {
            "name": "Alameda",
            "votes": 6
          }
        }
      }`);
      const v1 = TallyVotesByCountyResult.fromJSON(s1);
      const s2 = JSON.stringify(v1);
      assert.equal(s2, s1);
    });

    test('tally by state serialization', function () {
      const s1 = minify(`
      {
        "stateTallies": {
          "Washington": {
            "name": "Washington",
            "votes": 8
          },
          "Oregon": {
            "name": "Oregon",
            "votes": 4
          },
          "California": {
            "name": "California",
            "votes": 2
          }
        }
      }`);
      const v1 = TallyVotesByStateResult.fromJSON(s1);
      const s2 = JSON.stringify(v1);
      assert.equal(s2, s1);
    });

    test('tally candidate by state serialization', function () {
      const s1 = minify(`
      {
        "candidateByStateTallies": {
          "California": {
            "candidateTallies": {
              "panther": {
                "name": "panther",
                "votes": 2
              },
              "tiger": {
                "name": "tiger",
                "votes": 2
              },
              "lion": {
                "name": "lion",
                "votes": 1
              }
            }
          },
          "Oregon": {
            "candidateTallies": {
              "tiger": {
                "name": "tiger",
                "votes": 4
              },
              "lion": {
                "name": "lion",
                "votes": 1
              }
            }
          },
          "Washington": {
            "candidateTallies": {
              "leopard": {
                "name": "leopard",
                "votes": 1
              },
              "panther": {
                "name": "panther",
                "votes": 1
              },
              "tiger": {
                "name": "tiger",
                "votes": 1
              }
            }
          }
        }
      }`);
      const v1 = TallyCandidateVotesByStateResult.fromJSON(s1);
      const s2 = JSON.stringify(v1);
      assert.equal(s2, s1);
    });

  }); // suite: serialization tests

  suite('basic postgres wrapper tests', function () {
    let db;

    // randomly generated database name used for testing, dropped when finished
    const dbName = id();

    suiteSetup(async () => {
      // Create a standard config and override database with generated database name
      // (a standard config overrides defaults with values from the environment and finally any explicit values)
      const config = Database.createStdConfig({database: dbName, idleTimeoutMillis: 100});

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
      const v = new Vote(
        new Voter(null, "Alameda", "California"),
        new Candidate("panther", "blue")
      );

      const doc = await db.updateVote(v);
      assert.ok(v.voter.voter_id);
      assert.ok(doc);
      assert.equal(doc, v);
      assert.ok(doc.voter.voter_id);

      // clear table once test is done here so our tally is correct later
      await db.truncateTable()
    });

    test('missing vote property should throw', async () => {
      // invalid vote (must have vote property)
      const v = new Vote(
        new Voter(null, "Alameda", "California")
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
      const count_a = 4;
      for (let i = 0; i < count_a; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      const count_b = 5;
      for (let i = 0; i < count_b; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const tally = await db.tallyVotesByCandidate();
      assert.ok(tally);
      assert.equal(tally.get("panther").votes, count_a, `'panther' => expected: ${count_a}, actual: ${tally.get("panther").votes}`);
      assert.equal(tally.get("tiger").votes, count_b, `'tiger' => expected: ${count_b}, actual: ${tally.get("tiger").votes}`);
      // clear table once test is done here so our tally is correct later
      await db.truncateTable()
    });

    test('tally votes by county', async () => {
      const count_marin = 2;
      for (let i = 0; i < count_marin; i++) {
        const v = new Vote(
          new Voter(null, "Marin", "California"),
          new Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      const count_alameda = 6;
      for (let i = 0; i < count_alameda; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const tally = await db.tallyVotesByCounty();
      assert.ok(tally);
      assert.equal(tally.get("Marin").votes, count_marin, `'Marin' => expected: ${count_marin}, actual: ${tally.get("Marin").tally}`);
      assert.equal(tally.get("Alameda").votes, count_alameda, `'Alameda' => expected: ${count_alameda}, actual: ${tally.get("Alameda").tally}`);
      // clear table once test is done here so our tally
      // is correct later
      await db.truncateTable()
    });

    test('tally total votes by state', async () => {
      const count_ca = 2;
      for (let i = 0; i < count_ca; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      const count_or = 4;
      for (let i = 0; i < count_or; i++) {
        const v = new Vote(
          new Voter(null, "Harney", "Oregon"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const count_wa = 8;
      for (let i = 0; i < count_wa; i++) {
        const v = new Vote(
          new Voter(null, "Okanogan", "Washington"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const tally = await db.tallyVotesByState();
      assert.ok(tally);
      assert.equal(tally.get("California").votes, count_ca, `'California' => expected: ${count_ca}, actual: ${tally.get("California").votes}`);
      assert.equal(tally.get("Oregon").votes, count_or, `'Oregon' => expected: ${count_or}, actual: ${tally.get("Oregon").votes}`);
      assert.equal(tally.get("Washington").votes, count_wa, `'Washington' => expected: ${count_wa}, actual: ${tally.get("Washington").votes}`);
      // clear table once test is done here so our tally is correct later
      await db.truncateTable()
    });

    test('tally candidate votes by state', async () => {
      const count_ca_panther = 2;
      for (let i = 0; i < count_ca_panther; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      const count_ca_lion = 1;
      for (let i = 0; i < count_ca_lion; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      const count_ca_tiger = 2;
      for (let i = 0; i < count_ca_tiger; i++) {
        const v = new Vote(
          new Voter(null, "Alameda", "California"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const count_or_tiger = 4;
      for (let i = 0; i < count_or_tiger; i++) {
        const v = new Vote(
          new Voter(null, "Harney", "Oregon"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const count_or_lion = 1;
      for (let i = 0; i < count_or_lion; i++) {
        const v = new Vote(
          new Voter(null, "Harney", "Oregon"),
          new Candidate("lion", "blue")
        );
        await db.updateVote(v);
      }

      const count_wa_tiger = 1;
      for (let i = 0; i < count_wa_tiger; i++) {
        const v = new Vote(
          new Voter(null, "Okanogan", "Washington"),
          new Candidate("tiger", "blue")
        );
        await db.updateVote(v);
      }

      const count_wa_panther = 1;
      for (let i = 0; i < count_wa_panther; i++) {
        const v = new Vote(
          new Voter(null, "Okanogan", "Washington"),
          new Candidate("panther", "blue")
        );
        await db.updateVote(v);
      }

      const count_wa_leopard = 1;
      for (let i = 0; i < count_wa_leopard; i++) {
        const v = new Vote(
          new Voter(null, "Okanogan", "Washington"),
          new Candidate("leopard", "blue")
        );
        await db.updateVote(v);
      }

      const tally = await db.tallyCandidateVotesByState();
      assert.ok(tally);
      assert.ok(tally.get("California"))
      assert.ok(tally.get("Oregon"))
      assert.ok(tally.get("Washington"))
      assert.equal(tally.get("California").candidateTallies.get("panther").votes, count_ca_panther,
        `'California panther' => expected: ${count_ca_panther}, actual: ${tally.get("California").candidateTallies.get("panther").votes}`);
      assert.equal(tally.get("California").candidateTallies.get("lion").votes, count_ca_lion,
        `'California lion' => expected: ${count_ca_lion}, actual: ${tally.get("California").candidateTallies.get("lion").votes}`);
      assert.equal(tally.get("California").candidateTallies.get("tiger").votes, count_ca_tiger,
        `'California tiger' => expected: ${count_ca_tiger}, actual: ${tally.get("California").candidateTallies.get("tiger").votes}`);
      assert.equal(tally.get("Oregon").candidateTallies.get("tiger").votes, count_or_tiger,
        `'Oregon tiger' => expected: ${count_or_tiger}, actual: ${tally.get("Oregon").candidateTallies.get("tiger").votes}`);
      assert.equal(tally.get("Oregon").candidateTallies.get("lion").votes, count_or_lion,
        `'Oregon lion' => expected: ${count_or_lion}, actual: ${tally.get("Oregon").candidateTallies.get("lion").votes}`);
      assert.equal(tally.get("Washington").candidateTallies.get("tiger").votes, count_wa_tiger,
        `'Washington tiger' => expected: ${count_wa_tiger}, actual: ${tally.get("Washington").candidateTallies.get("tiger").votes}`);
      assert.equal(tally.get("Washington").candidateTallies.get("panther").votes, count_wa_panther,
        `'Washington panther' => expected: ${count_wa_panther}, actual: ${tally.get("Washington").candidateTallies.get("panther").votes}`);
      assert.equal(tally.get("Washington").candidateTallies.get("leopard").votes, count_wa_leopard,
        `'Washington leopard' => expected: ${count_wa_leopard}, actual: ${tally.get("Washington").candidateTallies.get("leopard").votes}`);
      // clear table once test is done here so our tally is correct later
      await db.truncateTable()
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
