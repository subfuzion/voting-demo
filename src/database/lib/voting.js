export class Candidate {
  name;
  party;

  constructor(name, party) {
    this.name = name;
    this.party = party;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`Candidate.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new Candidate(j.name, j.party);
    } catch (e) {
      throw new Error(`Candidate.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      name: this.name,
      party: this.party,
    };
  }
}

export class Voter {
  voter_id;
  county;
  state;

  constructor(voter_id, county, state) {
    this.voter_id = voter_id;
    this.county = county;
    this.state = state;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`Voter.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new Voter(j.voter_id, j.county, j.state);
    } catch (e) {
      throw new Error(`Voter.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      voter_id: this.voter_id,
      county: this.county,
      state: this.state,
    };
  }
}

export class Vote {
  voter;
  candidate;

  constructor(voter, candidate) {
    this.voter = voter;
    this.candidate = candidate;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`Vote.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new Vote(Voter.fromJSON(j.voter), Candidate.fromJSON(j.candidate));
    } catch (e) {
      throw new Error(`Vote.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      voter: this.voter.toJSON(),
      candidate: this.candidate.toJSON(),
    };
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

export class CandidateTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`CandidateTally.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new CandidateTally(j.name, j.votes);
    } catch (e) {
      throw new Error(`CandidateTally.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      name: this.name,
      votes: this.votes,
    };
  }
}

export class TallyVotesByCandidateResult {
  candidateTallies = new Map();

  set(name, votes) {
    if (name instanceof CandidateTally) {
      this.candidateTallies.set(name.name, name);
    } else {
      this.candidateTallies.set(name, new CandidateTally(name, votes));
    }
  }

  get(name) {
    return this.candidateTallies.get(name);
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`TallyVotesByCandidateResult.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      const tally = new TallyVotesByCandidateResult();
      for (const [name, candidateTally] of Object.entries(j.candidateTallies)) {
        tally.set(name, candidateTally.votes);
      }
      return tally;
    } catch (e) {
      throw new Error(`TallyVotesByCandidateResult.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      candidateTallies: Object.fromEntries(this.candidateTallies),
    };
  }
}

export class CountyTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`CountyTally.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new CountyTally(j.name, j.votes);
    } catch (e) {
      throw new Error(`CountyTally.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      name: this.name,
      votes: this.votes,
    };
  }
}

export class TallyVotesByCountyResult {
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

  get(name) {
    return this.countyTallies.get(name);
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`TallyByCountyResult.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      const tally = new TallyVotesByCountyResult();
      for (const [name, countyTally] of Object.entries(j.countyTallies)) {
        tally.set(name, countyTally.votes);
      }
      return tally;
    } catch (e) {
      throw new Error(`TallyByCountyResult.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      countyTallies: Object.fromEntries(this.countyTallies),
    };
  }
}

export class StateTally {
  name;
  votes;

  constructor(name, votes) {
    this.name = name;
    this.votes = votes;
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`StateTally.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      return new StateTally(j.name, j.votes);
    } catch (e) {
      throw new Error(`StateTally.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      name: this.name,
      votes: this.votes,
    };
  }
}

export class TallyVotesByStateResult {
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

  get(name) {
    return this.stateTallies.get(name);
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`TallyByStateResult.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      const tally = new TallyVotesByStateResult();
      for (const [name, stateTally] of Object.entries(j.stateTallies)) {
        tally.set(name, stateTally.votes);
      }
      return tally
    } catch (e) {
      throw new Error(`TallyByStateResult.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      stateTallies: Object.fromEntries(this.stateTallies),
    };
  }
}

export class TallyCandidateVotesByStateResult {
  candidateByStateTallies = new Map();

  set(state, name, votes) {
    if (!this.candidateByStateTallies.has(state)) {
      this.candidateByStateTallies.set(state, new TallyVotesByCandidateResult());
    }

    this.candidateByStateTallies.get(state).set(name, votes);
  }

  get(state) {
    return this.candidateByStateTallies.get(state);
  }

  static fromJSON(arg) {
    let j = arg;
    if (typeof j === "string") {
      try {
        j = JSON.parse(arg);
      } catch (e) {
        throw new Error(`TallyCandidateVotesByStateResult.fromJSON: can't parse: ${arg}`);
      }
    }
    try {
      const tally = new TallyCandidateVotesByStateResult();
      for (const [state, candidateByStateTally] of Object.entries(j.candidateByStateTallies)) {
        for (const [name, candidateTally] of Object.entries(candidateByStateTally.candidateTallies)) {
          tally.set(state, name, candidateTally.votes);
        }
      }
      return tally;
    } catch (e) {
      throw new Error(`TallyCandidateVotesByStateResult.fromJSON: ${e.message}`);
    }
  }

  toJSON() {
    return {
      candidateByStateTallies: Object.fromEntries(this.candidateByStateTallies),
    };
  }
}
