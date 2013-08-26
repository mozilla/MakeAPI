# MakeAPI

This project contains the server portion of the MakeAPI. If you want to consume the API, there is a client library available here: https://github.com/mozilla/makeapi-client

## Running the Server

### Prerequisites

- [MongoDB](http://www.mongodb.org/)
  - Run this with `mongod`
- [ElasticSearch](http://www.elasticsearch.org/)
  - Run this with `elasticsearch -f`

### Dependencies

Execute `npm install` in the application directory:


### Running in Development mode

#### Configuration for Node w/ Habitat

Copy and edit your .env file. -- This should never be committed to the repo.

```
cp env.sample .env
```

#### Running the Services

Before you start your Node.js server, you'll need to run MongoDB and ElasticSearch

#### Running the Node Server

Assuming MongoDB and ElasticSearch are running at the specified places in your `.env` file simply running `node server.js` from the root should start the server.

By default the server will run at http://localhost:5000. You can change this by adding PORT=<port> to your .env file.

#### API Keys

The Create, Update and Delete Routes are protected using [Hawk](https://github.com/hueniverse/hawk).

All applications that wish to make authenticated calls must be issued a pair of keys to sign all requests. Keys are optional for search requests.

The generation of keys can be done using the [generateKeys](https://github.com/mozilla/MakeAPI/blob/master/scripts/generateKeys.js) script.

The script is called with two arguments: an email address to associate with the keys and a integer indicating the number of pairs to be generated. Generated keys are added to the database and then outputted to the console.

There is also a tool in the Admin Make Editor that generates keys. It can be reached by visiting `http://localhost:5000/admin` (change the hostname & port appropriately)

For convenience of development and testing, the `USE_DEV_KEY_LOOKUP` variable can be set to true in the environment file. This flag will use a **DEVELOPMENT ONLY** strategy when verifying keys.

When development key mode is enabled, clients can sign their requests by passing hawk `"00000000-0000-0000-000000000000" as their public and private key. Any other key combination will fail to authenticate.

**DO NOT USE DEV KEYS OUTSIDE OF A DEVELOPMENT ENVIRONMENT!**

#### New Relic

To enable New Relic, set the `NEW_RELIC_ENABLED` environment variable and add a config file, or set the relevant environment variables.

For more information on configuring New Relic, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent

#### Deploying to Heroku

If you don't have **Heroku Toolbelt** get it here https://toolbelt.heroku.com/.

You will need an account with heroku. If you don't have one, sign up for one at http://heroku.com.

1. Ensure you are logged in first by running `heroku login`
2. Go to the root of the repo.
3. `heroku create`
4. Add the necessary plugins using `heroku addons:add <plugin name>`. Supported MongoDB plugins are: MongoHQ and MongoLab. Supported Elastic Search plugins are: FoundElasticSearch and Bonsai. Installing a plugin should automatically set up the required environment variables.
5. You should be ready to push up to heroku! `git push heroku featureBranchName:master`. If all goes well, your app should deploy. You can see logs by running `heroku logs` and you can open the MakeAPI in a browser by running `heroku open`.

#### Testing the API

The QueryBuilder's mocha test suite can be run by executing `npm test`. NOTE: you must have installed mocha, `npm install -g mocha`

## API:

<table>
  <tr>
    <th>HTTP Method</th>
    <th>Path</th>
    <th>Action</th>
    <th>Notes</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <th>POST</th>
    <td>/api/make</td>
    <td>Create Make</td>
    <td>
      If post data contains a valid Make, it creates one and returns it with the _id.
      Post Data should be a JSON object specifying the id of the authenticated webmaker creating the Make<br />
      <code>{ "maker": "username", make: { ... } } </code>
    </td>
    <td><strong>Yes</strong></td>
  </tr>
  <tr>
    <th>PUT</th>
    <td>/api/make/:id</td>
    <td>Update a Make</td>
    <td>The Make must already exist. This is an implementation of optimistic locking.
    Post Data should be a JSON object specifying the id of the authenticated webmaker updating the Make and a flag indicating if the user has admin priveliges.<br />
      <code>{ "maker": "username", make: { ... } }
    </td>
    <td><strong>Yes</strong></td>
  </tr>
  <tr>
    <th>DELETE</th>
    <td>/api/make/:id</td>
    <td>Deletes a Make</td>
    <td>The effect is that of a delete operation, though the Make is actually only marked as deleted using the <code>deletedAt</code> timestamp.
    Post Data should be a JSON object specifying the id of the authenticated webmaker deleting the Make and a flag indicating if the user has admin priveliges.<br />
      <code>{ "maker": "username" }</td>
    <td><strong>Yes</strong></td>
  </tr>
  <tr>
    <th>GET</th>
    <td>/api/makes/search</td>
    <td>Find makes by search criteria</td>
    <td><p>Searches for makes using <a href="http://www.elasticsearch.org">elasticsearch</a>. The Query String of your request must be stringified and escaped JSON, and must use <a href="http://www.elasticsearch.org/guide/reference/query-dsl/">elastic search's Query DSL</a>. e.g. <code>/api/makes/search/?s=URLENCODEDSEARCHSTRING</code></p></td>
    <td><strong>No</strong></td>
  </tr>
</table>


### Consuming the API

The [makeapi-client](https://github.com/mozilla/makeapi-client) should be used to facilitate interaction with the API.
Documentation can be found [here](https://github.com/mozilla/makeapi-client/blob/master/README.md)

**The Make API Does not sanitize Data it receives or outputs, so it is up to consumer applications to sanitize data appropriately.**

### Deleting all fake data

Clear elastic search:

`curl -XDELETE "http://localhost:9200"`

Find your mongo files and clear them. For example, if your `makeapi.1`, etc. are in `/data/db/`, run:

`rm /data/db/makeapi.*`
