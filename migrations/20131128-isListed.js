/* This script will update all makes in the database without an isListed field.
 * All old projects at this point will be considered listed to maintain old
 * expectations until new UI is implemented.`
 *
 * run this script from the root of the project like so:
 * node migrations/20131129-isListed
 */

var habitat = require( "habitat" ),
    ended = false,
    env;

habitat.load();

env = new habitat();

function saveCallback( err, doc ) {
  if ( err ) {
    console.error( err );
    process.exit( 1 );
  }
  if ( ended ) {
    console.log( "complete!" );
    process.exit( 0 );
  }
}

var dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.error( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      stream = Make.find({}).stream();

  stream.on( "data", function onData( doc ) {
    doc.isListed = true;
    doc.save( saveCallback );
  }).on( "error", function( err ) {
    console.error( err );
    process.exit( 1 );
  }).on( "end", function() {
    // simply ending here can break things because the stream ends before the last "data" callback.
    ended = true;
  });
});
