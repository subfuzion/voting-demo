const app = require('commander');
const axios = require('axios');
const format = require('util').format;
const inquirer = require('inquirer');
const pkg = require('./package.json');

// Can specify frontend as separate host and port components...
let apiOptions = {
  host: process.env.FRONTEND_HOST || 'localhost',
  port: process.env.FRONTEND_PORT || 8080
};

// ...or as a single URL
let url = process.env.FRONTEND;
if (url && !url.endsWith('/')) {
  url += '/';
}

let frontendURL = url ? url : `http://${apiOptions.host}:${apiOptions.port}/`;
let voteURL = frontendURL + 'vote/';
let resultsURL = frontendURL + 'results/';

let ax = axios.create({
  baseURL: frontendURL
});

/**
 * Log error message. Print 'error:' followed by remaining arguments,
 * separated by spaces. If the first argument is a format string, then
 * the remaining argument values will replace format string placeholders.
 * @param {*} args Variable arguments
 */
function logError(...args) {
  console.log('error:', format(...args));
}

/**
 * Exit process. 
 * @param {*E} code Optional exit code (default: 0)
 * @param {*} args Optional string arguments (first string can be a format string)
 */
function exit(code, ...args) {
  if (typeof code === 'string') {
    args.unshift(code);
    code = 0;
  }
  if (code === 0) {
    console.log(format(...args));
  } else {
    logError(...args);
  }
  process.exit(code);
}

// Handle the vote command and submit request to API.
/*eslint no-unused-vars: ["error", { "args": "none" }]*/
async function doVoteCmd(cmd, opts) {
  // question holds the prompt settings for the question
  // question.filter is used to transform user-friendly prompt choices to
  // the required values: 'cats' -> 'a',  'dogs' -> 'b',  '(quit)' -> 'q'
  let question = {
    type: 'list',
    name: 'vote',
    message: 'What do you like better?',
    choices: ['(quit)', 'cats', 'dogs'],
    filter: val => ( val === '(quit)' ? 'q' : ( val === 'cats' ? 'a' : 'b' ) )
  };
  let a = await inquirer.prompt(question);

  // if the answer is quit then exit
  if (a.vote === 'q') process.exit();

  try {
    // otherwise submit the answer to vote
    let res = await ax.post(voteURL, a);
    if (!res.data.success) {
      exit(1, 'command "vote" %s', res.data.reason);
    }
    console.log(voteToString(res.data.data));
  } catch (err) {
    exit(1, 'command "vote" %s', err.message);
  }
}

// Handle the results command and submit request to API.
/*eslint no-unused-vars: ["error", { "args": "none" }]*/
async function doResultsCmd(cmd, opts) {
  try {
    let res = await ax.get(resultsURL);
    if (!res.data.success) {
      exit(1, 'command "vote" %s', res.data.reason);
    }
    console.log(tallyToString(res.data.results));
  } catch (err) {
    exit(1, 'command "results" %s', err.message);
  }
}

// Pretty-print vote.
function voteToString(vote) {
  console.log(vote);
  if (!vote) return 'error: empty vote result';
  let id = vote.voter_id ? `${vote.voter_id}` : '-';
  let choice = ( vote.vote === 'a' ? 'cats' : 'dogs' );
  return `Vote (id: ${id}) for: ${choice}`;
}

// Pretty-print vote tally.
function tallyToString(tally) {
  if (!tally) return 'error: empty tally result';
  let a = tally.a, b = tally.b;
  let winner = ( a > b  ? 'CATS WIN!' : ( b > a ? 'DOGS WIN!' : 'IT\'S A TIE!' ) );
  return `Total votes -> cats: ${a}, dogs: ${b} ... ${winner}`;
}

function main() {
  // Ensure any unhandled promise rejections get logged.
  process.on('unhandledRejection', error => {
    logError('(unhandledRejection)', error);
  });

  app.version(pkg.version);

  app.command('vote')
    .description('vote for cats or dogs')
    .action(doVoteCmd);

  app.command('results')
    .description('tally the votes')
    .action(doResultsCmd);

  // parsing command line args invokes the app handlers
  try {
    app.showHelpAfterError();
    app.parse(process.argv);
  } catch (err) {
    exit(1, err);
  }
}

main();