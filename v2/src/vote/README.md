## Vote API

The service can be started with the following environment variable overrides:

`PORT`: the frontend listening port (defaults to port `8080`)
`DATABASE_HOST`: the database host (defaults to `database`)
`DATABASE_PORT`: the database host (defaults to `27017`)

### POST /vote

This endpoint is used to cast a vote.

#### Request Body

`application/json`

##### Schema

* `vote` - `string`; currently restricted to either "a" or "b"

##### Example

```
{
  "vote": "a"
}
```

### GET /results

This endpoint is used to query the voting results.

#### Response

`application/json`

* `success` - `boolean`

* `tally` - `object`; present only if success. The object has a property named
  for each vote ("a", "b"); the value of the property is a `number`
  corresponding to the number of votes cast.

* `reason` - `string`; present only if success is false.

#### Example:

```
{
  "success": true,
  "tally": {
    "a": 5,
    "b": 3
  }
}
```

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

When finished running a test, run:

    $ docker-compose -f ./docker-compose.test.yml down

> Warning: ensure you run the `down` command before the next `run sut`
> command to ensure each test run starts with a fresh database
> container. Otherwise, tests will fail.
