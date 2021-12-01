## Voting app client

Simple command-line client for accessing the voting app.

The following environment variables should be set:

`FRONTEND`: the voting app frontend (ex: `http://localhost:8080`)

or

`FRONTEND_HOST`: the frontend host (defaults to `frontend`)
`FRONTEND_PORT`: the frontend listening port (defaults to port `8080`)

You can run the backend using the docker compose file at the root
of the repo:

    $ docker compose up

When finished, run:

    $ docker compose down

### Usage

```text
$ client
Usage: client [options] [command]

Options:
-V, --version   output the version number
-h, --help      display help for command

Commands:
vote            vote for cats or dogs
results         tally the votes
help [command]  display help for command
```

To cast a vote:

```text
$ client vote
? What do you like better? (Use arrow keys)
❯ (quit)
  cats
  dogs
```

To see voting results:

```text
$ client results
Total votes -> cats: 1, dogs: 2 ... DOGS WIN!
```