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

Copy and edit your .env file. -- This should never be committed to the repo. Ensure that you fill in the ALLOWED_USERS variable.

```
cp env.sample .env
```

#### Running the Services

Before you start your Node.js server, you'll need to run MongoDB and ElasticSearch

#### Running the Node Server

Assuming MongoDB and ElasticSearch are running at the specified places in your `.env` file simply running `node server.js` from the root should start the server.


By default the server will run at http://localhost:5000. You can change this by adding PORT=<port> to your .env file.


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

Right now there is a small node app in `test/test-make-client.js` that will require in the API and make a sample create request. This is reliant upon the the entire repo being included down and not being pulled in through **NPM**. Eventually there will be tests not reliant on this.

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

```
  jQuery.ajax({
    type: "POST",
    url: "/api/make",
    data: {
      "user": "webmaker@host.com",
      "make": {
        "url": "http://thimble.webmadecontent.org/abcd.html",
        "contentType": "application/x-thimble",
        "title": "Animal something-or-other",
        "locale": "en_us",
        "tags": [ "awesome", "#css", "thimble.webmaker.org:project" ],
        "description": "This handy HTML template makes it easy to quickly create your own text and image mashup, then publish it for sharing via Facebook, Tumblr or any web page. Your 15 seconds of internet fame await!",
        "author": "swex@mozilla.com",
        "remixedFrom": null
      }
    },
    success: function(data, textStatus, jqXHR){
      console.log("Post response:");
      console.dir(data);
      console.log(textStatus);
      console.dir(jqXHR);
    },
    error: function(jqXHR, textStatus, errorThrown){
      console.log(jqXHR.responseText);
    }
  });
```
A client library has been written to aid in the consumption of this API.
Documentation can be found [here](public/js/README.md)

### Searching Test Ground

If you load http://localhost:5000/search.html, you can use the basic set of form fields to create/update/delete makes and search based on several fields.'

### Generating fake data

Running `AUTH=<username>:<password node test/post.js` from the root of the repository will generate one thousand fake records in your database. Be sure to include a valid username and password as an environment variable.

### Deleting all fake data

Clear elastic search:

`curl -XDELETE "http://localhost:9200"`

Find your mongo files and clear them. For example, if your `makeapi.1`, etc. are in `/data/db/`, run:

`rm /data/db/makeapi.*`
