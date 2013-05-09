/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Bring in all your require modules
var express = require( "express" ),
    path = require( "path" ),
    faker = require( "Faker" );

// Generate app variables
var app = express(),
    Make = require( "../public/js/make-api" ),
    makeClient = Make({
      apiURL: "http://localhost:5000",
      auth: "testuser:password"
    }),
    IMG_CATEGORIES = [
      "abstract",
      "animals",
      "business",
      "cats",
      "city",
      "foodnight",
      "life",
      "fashion",
      "people",
      "nature",
      "sports",
      "technics",
      "transport"
    ];

app.use( express.logger( "dev" ) );
app.use( express.compress() );
app.use( express.static( path.join( __dirname + "/public" ) ) );
app.use( express.bodyParser() );
app.use( express.cookieParser() );

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

app.get( "/", function( req, res ) {
  makeClient.create({
    title: faker.random.catch_phrase_adjective() + " " + faker.random.bs_adjective() + " " + faker.random.bs_noun(),
    author: faker.Name.findName(),
    description: faker.Lorem.paragraph(),
    thumbnail: "http://www.lorempixel.com/640/350/" + faker.Helpers.randomize( IMG_CATEGORIES ) + "/" + faker.random.number( 10 ),
    contentType: faker.Helpers.randomize( [ "application/x-butter", "application/x-thimble", "text/html" ] ),
    locale: faker.Helpers.randomize(["en_us","en_ca","en_gb"]),
    url: "http://www.webmaker.org/" + faker.random.number( 99999999999 ),
    remixedFrom: null,
    email: faker.Helpers.randomize([
        "matts@mozillafoundation.org", "kate@mozillafoundation.org", "jbuck@mozillafoundation.org",
        "scott@mozillafoundation.org", "surman@mozillafoundation.org", "pomax@mozillafoundation.org",
        faker.Internet.email()
    ]),
    tags: [
      "test:project",
      "test:featured"
    ]
  }, function( error, result ) {
    if ( !error ) {
      res.send(JSON.stringify( result, null, 2 ) );
    }
  });
});

app.listen( 4000, function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:4000 )" );
});
