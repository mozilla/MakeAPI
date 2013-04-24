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
cp .env.sample .env
```

#### Running the Services

Before you start your Node.js server, you'll need to run MongoDB and ElasticSearch

#### Running the Node Server

Assuming MongoDB and ElasticSearch are running at the specified places in your `.env` file simply running `node server.js` from the root should start the server.


By default the server will run at http://localhost:5000. You can change this by adding PORT=<port> to your .env file.

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
  </tr>
  <tr>
    <th>POST</th>
    <td>/api/make</td>
    <td>Create Make</td>
    <td>If Post Data is a valid Make, it creates one and returns it with the _id and __v populated.</td>
  </tr>
  <tr>
    <th>GET</th>
    <td>/api/make/:id</td>
    <td>Find a single Make</td>
    <td>Expects the last path element to be a valid ObjectId</td>
  </tr>
  <tr>
    <th>PUT</th>
    <td>/api/make/:id</td>
    <td>Update a Make</td>
    <td>The Make must already exist and the __v must be the same as the current version on the server. This is an implementation of optimistic locking.</td>
  </tr>
  <tr>
    <th>DELETE</th>
    <td>/api/make/:id</td>
    <td>Deletes a Make</td>
    <td>The effect is that of a delete operation, though the Make is actually only marked as deleted using the deletedAt timestamp.</td>
  </tr>
  <tr>
    <th>GET</th>
    <td>/api/makes/search</td>
    <td>Find makes by search criteria</td>
    <td><p>Searches for makes using <a href="http://www.elasticsearch.org">elasticsearch</a>. The Query String of your request must be stringified and escaped JSON, and must use <a href="http://www.elasticsearch.org/guide/reference/query-dsl/">elastic search's Query DSL</a>. e.g. <code>/api/makes/search/?s=URLENCODEDSEARCHSTRING</code></p></td>
  </tr>
</table>


### Example Usage

```
  jQuery.ajax({
    type: "POST",
    url: "/api/make",
    data: {
      "url": "http://thimble.webmadecontent.org/abcd.html",
      "contentType": "text/html",
      "title": "Animal something-or-other",
      "locale": "en_us",
      "tags": ["awesome"],
      "privateTags": ["webmaker.org:project", "skill:css"],
      "description": "This handy HTML template makes it easy to quickly create your own text and image mashup, then publish it for sharing via Facebook, Tumblr or any web page. Your 15 seconds of internet fame await!",
      "author": "swex@mozilla.com",
      "contentAuthor": "swex@mozilla.com",
      "remixedFrom": null,
      "published": true
    },
    success: function(data, textStatus, jqXHR){
      console.log("Post resposne:");
      console.dir(data);
      console.log(textStatus);
      console.dir(jqXHR);
    },
    error: function(jqXHR, textStatus, errorThrown){
      console.log(jqXHR.responseText);
    }
  });
```

### Searching Test Ground

If you load http://localhost:5000/search.html, you can use the basic set of form fields to create/update/delete makes and search based on several fields.'

### Deleting all fake data

Clear elastic search:

`curl -XDELETE "http://localhost:9200"`

Find your mongo files and clear them. For example, if your `makeapi.1`, etc. are in `/data/db/`, run:

`rm /data/db/makeapi.*`
