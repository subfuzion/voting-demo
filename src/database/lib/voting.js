class Candidate {
  name;
  party;

  constructor(name, party) {
    this.name = name;
    this.party = party;
  }
}

class Voter {
  voter_id;
  county;
  state;

  constructor(voter_id, county, state) {
    this.voter_id = voter_id;
    this.county = county;
    this.state = state;
  }
}

class Vote {
  voter;
  candidate;

  constructor(voter, candidate) {
    this.voter = voter;
    this.candidate = candidate;
  }

  validate() {
    let errors = [];

    if (!this.voter) {
      errors.push('missing voter');
    } else {
      if (!this.voter.county) {
        errors.push('missing voter county');
      }
      if (!this.voter.state) {
        errors.push('missing voter state');
      }
    }

    if (!this.candidate) {
        errors.push('missing candidate');
    } else {
      if (!this.candidate.name) {
        errors.push('missing candidate name');
      }
      if (!this.candidate.party) {
        errors.push('missing candidate party');
      }
    }

    return errors;
  }
}

module.exports = {
  Candidate: Candidate,
  Voter: Voter,
  Vote: Vote
}
