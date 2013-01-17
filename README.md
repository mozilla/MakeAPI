# MakeAPI

## Running the Server

### Prerequisites

- [Redis](http://redis.io/)
- [MongoDB](http://www.mongodb.org/)
- [ElasticSearch](http://www.elasticsearch.org/)

### Dependencies

Execute `npm install` in the application directory:


### Running in Development mode

It's recommended that you use Foreman to run your development server. "Why?", you ask. Here's a great intro: [Introducing Foreman](http://blog.daviddollar.org/2011/05/06/introducing-foreman.html).

#### Configuration for Foreman

Copy and edit your .env file. -- This should never be committed to the repo.

```
cp .env.sample .env
```

#### Running the Services

There's a handy file named Procfile.services you can use to run Redis, ElasticSearch and MongoDB. To start all three services run:

```
foreman start -f Procfile.services
```

While either that is running, or the services are running independently, you can start the web server:

#### Running the Web Process

```
foreman start
```

By default the server will run at http://localhost:5000. You can change this by adding PORT=<port> to your .env file.


## Running the Tests

```
$ npm test
```

## Usage:

```
jQuery.ajax({
  type: "POST",
  url: "/api/make",
  data: {
    url: "http://thimble.webmaker.org/p/fj6v",
    contentType: "text/html",
    locale: "en_us",
    title: "Soapbox - Let your voice be heard",
    body: "<h1>Make Your Own Rant Page</h1><p>blah blah blah, this is your pulpit.</p>",
    difficulty: 'Beginner',
    author: "simon@simonwex.com",
    contentAuthor: 'swex@mozilla.com',
    published: true
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
