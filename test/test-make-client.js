// Bring in all your require modules
var express = require( "express" ),
    path = require( "path" );

// Generate app variables
var app = express(),
    Make = require( "../public/js/make-api" ),
    makeClient = Make({
      makeAPI: "http://localhost:5000"
    });

app.use( express.logger() );
app.use( express.compress() );
app.use( express.static( path.join( __dirname + "/public" ) ) );
app.use( express.bodyParser() );
app.use( express.cookieParser() );

app.get( "/", function( req, res ) {
  makeClient.createMake({
    title: "Test Title",
    author: "test@email.com",
    body: "This is a test body",
    contentType: "application/butter",
    difficulty: "Beginner",
    locale: "en_us",
    url: "www.test.com",
    tags: [
      "test:project",
      "test:featured"
    ]
  }, function() {
    res.send(JSON.stringify( arguments, null, 2 ));
  })
});

app.listen( 4000, function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:4000 )" );
});
