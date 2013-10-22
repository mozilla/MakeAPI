/* This script will update all makes in the database with an updatedAt
 * value if it is not defined.
 *
 * run this script from the root of the project like so:
 * node migrations/20131009-updatedAt
 */

var habitat = require( "habitat" ),
    url = require( "url" ),
    ended = false,
    env;

habitat.load();

env = new habitat();

function saveCallback( err, doc ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }
  if ( ended ) {
    console.log( "complete!" );
    process.exit( 0 );
  }
}

var dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      stream = Make.find().stream();

  stream.on( "data", function onData( doc ) {
    var thumbnail = doc.thumbnail,
        parsedThumbnail,
        newThumbnail;

    if ( !thumbnail ) {
      return;
    }

    parsedThumbnail = url.parse( thumbnail );

    if ( parsedThumbnail.protocol === "https:" || parsedThumbnail.href.indexOf( "stuff.webmaker.org " ) === -1 ) {
      return;
    }

    newThumbnail = "https://stuff.webmaker.org" + parsedThumbnail.pathname;
    doc.thumbnail = newThumbnail;
    doc.save( saveCallback );

  }).on( "error", function( err ) {
    process.exit( 1 );
  }).on( "end", function() {
    // simply ending here can break things because the stream ends before the last "data" callback.
    ended = true;
  });
});
