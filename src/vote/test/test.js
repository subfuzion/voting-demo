import assert from "assert";
import axios from "axios";

import * as voting from "@subfuzion/vote-database/voting";
import {TallyVotesByCandidateResult} from "@subfuzion/vote-database/voting";


const serviceName = process.env.SERVICE_NAME || 'vote';
const port = process.env.PORT || 8080;

const TEST_TIMEOUT = 1000 * 5;

suite('vote tests', function() {
  const api = axios.create({
    baseURL: `http://${serviceName}:${port}/`,
  });

  suite('tally by candidates', function() {
    const votes_a = 3;
    const votes_b = 2;

    suiteSetup(async function() {
      this.timeout(TEST_TIMEOUT);

      // initialize test votes
      let votes = [];

      for (let i = 0; i < votes_a; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("panther", "blue")
        );
        votes.push(v);
      }

      for (let i = 0; i < votes_b; i++) {
        let v = new voting.Vote(
          new voting.Voter(null, "Alameda", "California"),
          new voting.Candidate("tiger", "blue")
        );
        votes.push(v);
      }

      // post votes
      await Promise.all(votes.map(async (vote) => {
        let resp;
        try {
          resp = await api.post('/vote', vote);
          assert.equal(resp.status, 200);
          // console.log(resp.data);
          assert.ok(resp.data.success);
        } catch (e) {
          console.log(e.message);
          if (e.config) console.log("config: " + e.config.data);
          if (e.response) console.log("response: " + e.response.data);
        }
      }));
    });

    suiteTeardown(function() {

    });

    test('tally votes', async() => {
      let resp = await api.get('/tally/candidates');
      assert.ok(resp.data.success);
      let tally = voting.TallyVotesByCandidateResult.fromJSON(resp.data.results);
      assert.ok(tally);
      assert.equal(tally.get("panther").votes, votes_a, `'panther' => expected: ${votes_a}, actual: ${tally.get("panther").votes}`);
      assert.equal(tally.get("tiger").votes, votes_b, `'tiger' => expected: ${votes_b}, actual: ${tally.get("tiger").votes}`);


    });

  }); // suite: tally by candidates

});
