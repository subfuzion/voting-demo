[![npm (scoped)](https://img.shields.io/npm/v/@subfuzion/database.svg)](@subfuzion/database)
[![node (scoped)](https://img.shields.io/node/v/@subfuzion/database.svg)](@subfuzion/database)

# @subfuzion/database

This is a simple database library package that provides the ability to save and
tally votes to a [MongoDB](https://www.mongodb.com/) database. It uses
the [MongoDB Node Driver](https://docs.mongodb.com/drivers/node/).

Votes are stored as documents in the `votes` collection of the `voting`
database.

## Testing

The easiest way is to test using Docker Compose.

The following will build an image for running the tests under `test/` and then
start the environment declared in `./docker-compose.test.yml`.

    $ docker compose -f ./docker-compose.test.yml run sut

If you make changes to any of the Node.js sources, rebuild the test image with
the following command:

    $ docker compose -f ./docker-compose.test.yml build

To view logs, run:

    $ docker compose -f ./docker-compose.test.yml logs

When finished with tests, run:

    $ docker-compose -f ./docker-compose.test.yml down

To delete the generated image:

    $ docker images rm database_sut

### Testing without Docker Compose

MongoDB needs to be available before running tests. The tests default to port
the standard MongoDB port 27017 on localhost, but host and port can be
overridden by setting HOST and PORT environment variables.

If you have [Docker](https://www.docker.com/) installed, you can easily start
MongoDB with the default values by running the following command:

    $ docker run -d -p 27017:27017 --name mongodb mongodb

This will run a MongoDB container named mongodb in the background with port
27017 on your system mapped to the exposed port 27017 in the container.

To run the tests, enter the following:

    $ npm test

When finished, you can remove the running container from your system with:

    $ docker rm -f mongodb

## Using the @subfuzion/database package

Add the dependency to your package:

npm:

    $ npm install @subfuzion/vote-database

yarn:

    $ yarn add @subfuzion/vote-database

### Create a Mongo object

Require the package in your module:

    const Mongo = require('@subfuzion/vote-database').Mongo;

Create a new instance

    var db = new Mongo([options])

`options` is an optional object that defaults to the values from
`Mongo. defaults()` for any missing properties.

```js
const config = {
  host: 'database',
  port: 27017,
  database: 'votes'
};
```

There is a Mongo helper static method that will create the configuration that
can be overridden by environment variables:

```js
let defaults = {};
// explicit defaults will override environment variables, environment overrides internal defaults
let config = Mongo.createStdConfig(defaults);
let db = new Mongo(config);
await db.connect();
```

If any of the following environment variables are defined, then the values will
override the default values. Any values explicitly supplied in the config object
will override the environment.

    DATABASE_URI - valid mongo connection URI
    otherwise:
      DATABASE_HOST - hostname for the mongo server
      DATABASE_PORT - port that mongo is listening on
    DATABASE_NAME

### Storing votes

```js
var db = new Mongo([options])
let vote = {vote: 'a'} // valid values are 'a' or 'b'
await db.updateVote(vote)
// when finished with the database
await db.close()
```

### Tallying votes

```js
var db = new Mongo([options])
let tally = await db.tallyVotes()
// tally is an object: { a: <number>, b: <number> }
// when finished with the database
await db.close()
```

### Closing Connections

You should close the database connection when finished.

```js
await db.close()
```
