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
- [Webmaker.org server](https://github.com/mozilla/webmaker.org)


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

## 2. Consuming the API

The [makeapi-client JavaScript library](https://github.com/mozilla/makeapi-client) should be used to facilitate interaction with the API.
Documentation can be found [here](https://github.com/mozilla/makeapi-client/blob/master/README.md)

**The Make API Does not sanitize Data it receives or outputs, so it is up to consumer applications to sanitize data appropriately.**

## 3. Resources

### Env Variable Reference Section
All the environment variables are listed and detailed here: [https://github.com/mozilla/MakeAPI/wiki/ENV-Reference](https://github.com/mozilla/MakeAPI/wiki/ENV-Reference)

### RESTful API

#### POST [/api/20130724/make]
##### Create a make
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Body

        {
            make: {
                // required fields
                email: "fake@123.com",
                url: "http://notarealurl.com/make_asdf.html",
                contentType: "application/x-applicationName",
                title: "title of make",
                // optional fields
                contenturl: "http://realMakeURL.com/notbehindaproxy",
                locale: "en_CA",
                description: "description of make",
                thumbnail: "http://fakeimageURL.com/img123.gif",
                author: "anonymous person",
                tags: [
                    "foo",
                    "bar"
                ],
                remixedFrom: "OBJECTIDOFANOTHERMAKE"
            }
        }
+ Response 200 {application/json}

        {
            // The created Make in JSON format
        }

#### PUT [/api/20130724/make/{id}]
##### Update a make
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... ID of the Make to be updated
+ Body

        {
            make: {
                // any combination of fields to be updated (see create Route for fields)
            }
        }
+ Response 200 {application/json}

        {
            // The updated Make in JSON format
        }

#### DELETE [/api/20130724/make/{id}]
##### Delete a make
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... ID of the Make to be updated
+ Response 200 {application/json}

        {
            // The Deleted Make in JSON format
        }

#### GET [/api/20130724/make/search]
##### Search for makes
+ Query Params
    + author (string) - Author Name
    + user (string) - Webmaker Username
    + tags (string) - Comma separated string of tags
    + tagPrefix (string) - String representing the beginning of a tag
    + url (string) - Url of the make
    + contentType (string) - The contentType of the make
    + remixedFrom (string) - Object ID of a Make
    + id (string) - Object ID of a make
    + title (string) - Title of a make
    + description (string) - Description of a Make
    + limit (number) - Number of make results to return (MAX)
    + page (number) - Page number to request. i.e. 1000 results, 10 per page, show page 15
    + sortByField (string) - A make field on which to sort search results by.
    + or (string) - define to be any truthy value to have fields match on an "OR" basis. i.e. title is "a" or has the tag "b"
+ Response 200 {application/json}

        {
            makes: [
                // Array of Make Objects that matched search results
            ],
            total: {number} // total number of make records that matched your query (useful for building paginated UI)
        }

#### PUT [/api/20130724/make/like/{id}]
##### Adds a Webmaker User ID to a Makes likes array
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... Id of the Make to add a like to
+ Body

        {
            maker: "makerUsername"
        }
+ Response 200 {application/json}

        {
            // The just-liked Make in JSON format
        }

#### PUT [/api/20130724/make/unlike/{id}]
##### Removes a Webmaker User ID from the Makes likes array
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... Id of the Make to remove a like from
+ Body

        {
            maker: "makerUsername"
        }
+ Response 200 {application/json}

        {
            // The just-unliked Make in JSON format
        }

#### GET [/api/20130724/make/remixCount]
##### Count remixes of a given project for a given time range
+ Query Params
    + id - Make ID
    + from - Unix Timestamp
    + to - Unix Timestamp
+ Response 200 {application/json}

        {
            count: <int>
        }

#### GET [/api/20130724/make/tags]
##### Returns an array of tags that can be used to auto-complete the query parameter
+ Query Params
    + t (string) - A string to run the auto-complete request on
    + s (number) - A number representing how many results to return. Default is 10, Max is 1000
+ Response

        {
            tags: [
                {
                    term: "tag", // tag suggestion
                    count: {num} // number of occurences detected
                }
            ],
            total: {num} // number of suggestions found. May not equal the length of the tags array.
        }

#### POST [/api/20130724/list]
##### Create a List
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Body

        {
            makes: [ /* array of Make IDs */ ],
            userId: 1234 // UserId of user creating the List
        }
+ Response 200 {application/json}

        {
            // The created List in JSON format (Make Data is not hydrated!)
        }

#### PUT [/api/20130724/list/{id}]
##### Update a List
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... ID of the List to be updated
+ Body

        {
            userId: 1234 // userID of user making the update
            makes: [ /* an updated list of Make ID's */ ]
        }
+ Response 200 {application/json}

        {
            // The updated List in JSON format (Make Data is not hydrated!)
        }

#### DELETE [/api/20130724/list/{id}]
##### Delete a list
+ Headers
    + authorization - Hawk compatible authorization header
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... ID of the List to be updated
+ Response 200 {application/json}

        {
            // The Deleted List in JSON format (Make Data is not hydrated!)
        }

#### GET [/api/20130724/list/:id]
##### Get a List of ordered Makes by List ID. The ID's in the list's make array are hydrated with their corresponding make data and sorted.
+ Parameters
    + id (string) ... ID of the List to retrieve
+ Response 200 {application/json}

        {
            makes: [ /* Array of sorted Make data */]
        }

#### GET [/api/20130724/list/user/:id]
##### Get a List of lists that are owned by the given user ID
+ Parameters
    + id (string) ... ID of the user whose lists should be retrieved.
+ Response 200 {application/json}

        {
            lists: [
                {
                    _id: 12345
                    title: "Awesome Makes",
                    userId: 123,
                    username: "webmaker",
                    makes: [ /* ... */ ]
                }
            ]
        }
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
