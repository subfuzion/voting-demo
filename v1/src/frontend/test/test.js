const assert = require('assert');
const axios = require('axios');
const Database = require('@subfuzion/database').Database;

const serviceName = process.env.SERVICE_NAME || 'frontend';
const port = process.env.PORT || 8080;

suite('vote tests', () => {
  const api = axios.create({
    baseURL: `http://${serviceName}:${port}/`,
  });

  const votes_a = 3;
  const votes_b = 2;

  let db;

  setup(async function() {
    this.timeout(5 * 1000);

    // initialize test votes
    let votes = [];
    for (let i = 0; i < votes_a; i++) {
      votes.push({ vote: 'a' });
    }
    for (let i = 0; i < votes_b; i++) {
      votes.push({ vote: 'b' });
    }

    // post votes
    await Promise.all(votes.map(async (vote) => {
      let resp = await api.post('/vote', vote);
      console.log(resp.data);
    }));
  });

  test('tally votes', async() => {
    let resp = await api.get('/results');
    assert.ok(resp.data.success);
    let tally = resp.data.results;
    assert.equal(tally.a, votes_a, `'a' => expected: ${votes_a}, actual: ${tally.a}`);
    assert.equal(tally.b, votes_b, `'b' => expected: ${votes_b}, actual: ${tally.b}`);
  });
});