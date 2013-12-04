# MakeAPI

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

## POST [/api/20130724/make]
### Create a make
+ Headers
    + authorization - Hawk compatible authorization header
        + `'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'`
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

## PUT [/api/20130724/make/{id}]
### Update a make
+ Headers
    + authorization - Hawk compatible authorization header
        + `'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'`
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

## DELETE [/api/20130724/make/{id}]
### Delete a make
+ Headers
    + authorization - Hawk compatible authorization header
        + `'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'`
        + For more information about using Hawk, see https://github.com/hueniverse/hawk
+ Parameters
    + id (string) ... ID of the Make to be updated
+ Response 200 {application/json}

        {
            // The Deleted Make in JSON format
        }

## GET [/api/20130724/make/search]
### Search for makes
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

## PUT [/api/20130724/make/like/{id}]
### Adds a Webmaker User ID to a Makes likes array
+ Headers
    + authorization - Hawk compatible authorization header
        + `'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'`
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

## PUT [/api/20130724/make/unlike/{id}]
### Removes a Webmaker User ID from the Makes likes array
+ Headers
    + authorization - Hawk compatible authorization header
        + 'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'
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


### Consuming the API

The [makeapi-client](https://github.com/mozilla/makeapi-client) should be used to facilitate interaction with the API.
Documentation can be found [here](https://github.com/mozilla/makeapi-client/blob/master/README.md)

**The Make API Does not sanitize Data it receives or outputs, so it is up to consumer applications to sanitize data appropriately.**
