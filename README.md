[![Build Status](https://travis-ci.org/mozilla/webmaker.org.png)](https://travis-ci.org/mozilla/MakeAPI)
[![Dependency Status](https://gemnasium.com/mozilla/webmaker.org.png)](https://gemnasium.com/mozilla/MakeAPI)

# MakeAPI (core)
The MakeAPI is a node.js based service for storing and exposing metadata about user created web content, called "makes". It provides consumers with an API to Create, Update, Delete, and Search for metadata about a make.

**NOTE: This README assumes that you have all the required external dependencies installed and have a working dev environment. New to Webmaker? Make sure to read our <a href="https://wiki.mozilla.org/Webmaker/Code">developer guide</a> for everything you need in order to get started!**

## 1. Installing & Running the Server

### Dependencies

- [MongoDB](http://www.mongodb.org/)
  - *Mac OS X*: Run this with `mongod`
  - *Ubuntu-based linux systems.*: Run this with `sudo service mongodb start`
- [ElasticSearch](http://www.elasticsearch.org/)
  - *Mac OS X*: Run this with `elasticsearch -f`
  - *Ubuntu-based linux systems.*: Run this with `sudo service elasticsearch start`
- [Login server](https://github.com/mozilla/login.webmaker.org)


### Installation

1. Clone the git repository with `git clone https://github.com/mozilla/MakeAPI.git`
2. Execute `npm install` in the application directory.
3. In the root directory of the application, copy `env.sample` to a new file called `.env`

    **NOTE**: The `.env` file contains settings for various aspects of the MakeAPI server's operation. The default settings should be enough for local development. For non-standard configurations, you may need to adjust where variables point to match the locations of your external dependancies. See the [ENV file reference](https://github.com/mozilla/MakeAPI/wiki/ENV-File-Reference) for more details.

#### Running the Node Server

1. Ensure all external dependencies are running
2. Run `node server.js` from the root of the MakeAPI application

    By default the server will run at http://localhost:5000. You can change this by adding PORT=<port> to your .env file.

#### Clearing make data

Clear elastic search:

`curl -XDELETE "<URL of ElasticSearch Cluster>/<ElasticSearch Index Name>"`

Find your mongo files and clear them.

1. In a terminal run `mongo` add the --host <YOUR_MONGO_HOST> flag to connect to a remote mongo service
2. From the mongo shell run `use makeapi` to switch to the makeapi index
3. Run `db.dropDatabase()` to remove all existing make data and API keys from mongoDB

## 2. API Documentation

API documentation can be found at [https://mozilla.github.io/makeapi-docs/](https://mozilla.github.io/makeapi-docs/)

The [makeapi-client JavaScript library](https://github.com/mozilla/makeapi-client) can be used to facilitate interaction with the API in web browser and node contexts. Documentation for the client library can be found at [http://mozilla.github.io/makeapi-docs/client-docs/](http://mozilla.github.io/makeapi-docs/client-docs/)

**The Make API Does not sanitize Data it receives or outputs, so it is up to consumer applications to sanitize data appropriately.**

## 3. Resources

### Env Variable Reference Section
All the environment variables are listed and detailed here: [https://mozilla.github.io/makeapi-docs/#configuration](https://mozilla.github.io/makeapi-docs/#configuration)

## 4. Testing
### How to test
We use a combination of technologies to "lint" and test our CSS and JavaScript code. These tests **must** pass in order for a pull request to be merged into the Mozilla repository. To run them locally,

1.  Navigate to the root folder of the MakeAPI server
2.  Run `npm test`

### TravisCI
When a pull request is made to the Mozilla repository, it is automatically scheduled for testing on the [Travis-CI continuous-integration platform](https://travis-ci.org/). This verifies that the code passes linting requirements as well as all of its unit tests. You can see the status of these tests on the Github page for the pull request, and on the <a href="https://travis-ci.org/mozilla/MakeAPI/pull_requests">MakeAPI travisCI page</a>.

### Updating tests
Most developers won't need to update the tests, but changes to certain parts of the MakeAPI require that the tests be revised. Keeping these tests accurate is essential for easy maintenence of this code base, and pull requests that change these parts will be rejected without proper unit tests.

If you need help understanding the unit tests, hop on the #webmaker IRC channel and we'll be happy to help! No idea what IRC is? Check out our [IRC guide](https://wiki.mozilla.org/IRC).

## 5. Accessing the MakeAPI with your service

The MakeAPI uses [HAWK](https://github.com/hueniverse/hawk) to authenticate MakeAPI calls. Hawk is an HTTP authentication scheme that can be used to verify the authenticity of messages using cryptographically generated message authentication codes (MACs). Hawk does not provide Transport Layer security, and only serves to identify the sender and verify message integrity.

All applications that wish to make authenticated calls must be issued a pair of keys to sign all requests. Keys are optional for search requests.

### Authentication in a dev environment
For convenience of development and testing, the `USE_DEV_KEY_LOOKUP` variable can be set to true in the environment file. This flag will use a **DEVELOPMENT ONLY** strategy when verifying keys.

When development key mode is enabled, clients can sign their requests by passing hawk `"00000000-0000-0000-000000000000" as their public and private key. Any other key combination will fail to authenticate.

**DO NOT USE DEV KEYS OUTSIDE OF A DEVELOPMENT ENVIRONMENT!**

### Generating keys for production or staging servers w/ `generateKeys.js`

The generation of keys can be done using the [generateKeys](https://github.com/mozilla/MakeAPI/blob/master/scripts/generateKeys.js) script.

The script is called with two arguments: an email address to associate with the keys and a integer indicating the number of pairs to be generated. Generated keys are added to the database and then outputted to the console.

### Generating keys in the admin console

There is a tool in the Admin Make Editor that generates keys. It can be reached by visiting the /admin page of the MakeAPI in your browser. You must have a Webmaker admin account on the login server that the MakeAPI is using for authentication.

##  6. Metrics and logging
The MakeAPI server uses a number of technologies, like [STATSD](https://github.com/etsy/statsd/) and [New Relic](http://newrelic.com/), to optionally collect and analyze useful performance data. For local development, this shouldn't be a concern.

For more information on configuring the MakeAPI server's New Relic module, see: https://github.com/newrelic/node-newrelic/#configuring-the-agent
