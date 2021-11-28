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

class CandidateTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }
}
class TallyVotesByCandidateResult {
  candidateTallies = new Map();

  set(name, votes) {
    if (name instanceof CandidateTally) {
      this.candidateTallies.set(name.name, name);
    } else {
      this.candidateTallies.set(name, new CandidateTally(name, votes));
    }
  }
}

class CountyTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }
}
class TallyByCountyResult {
  countyTallies = new Map();

  constructor() {
    this.countyTallies = new Map();
  }

  set(name, votes) {
    if (name instanceof CountyTally) {
      this.countyTallies.set(name.name, name);
    } else {
      this.countyTallies.set(name, new CountyTally(name, votes));
    }
  }
}

class StateTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }
}
class TallyByStateResult {
  stateTallies = new Map();

  constructor() {
    this.stateTallies = new Map();
  }

  set(name, votes) {
    if (name instanceof StateTally) {
      this.stateTallies.set(name.name, name);
    } else {
      this.stateTallies.set(name, new StateTally(name, votes));
    }
  }
}

class TallyCandidateVotesByState {
  state;
  candidateTally;

  constructor(state, name, votes) {
    this.state = state;
    this.candidateTally = new CandidateTally(name, votes);
  }
}

class TallyCandidateVotesByStateResult {
  candidateByStateTallies = new Map();

  set(state, name, votes) {
    if (!this.candidateByStateTallies.has(state)) {
      this.candidateByStateTallies.set(state, new TallyVotesByCandidateResult());
    }

    this.candidateByStateTallies.get(state).set(name, votes);
  }
}

module.exports = {
  Candidate: Candidate,
  Voter: Voter,
  Vote: Vote,
  CandidateTally: CandidateTally,
  TallyByCandidateResult: TallyVotesByCandidateResult,
  TallyByCountyResult: TallyByCountyResult,
  TallyByStateResult: TallyByStateResult,
  TallyCandidateVotesByStateResult: TallyCandidateVotesByStateResult,
}
