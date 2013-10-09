/* This script will update all makes in the database with an updatedAt
 * value if it is not defined.
 *
 * run this script from the root of the project like so:
 * node migrations/20131009-updatedAt
 */

var habitat = require( "habitat" ),
    ended = false,
    env,
    mongoose;

habitat.load();

env = new habitat();

function saveCallback( err, doc ) {
  if ( err ) {
    throw err;
  }
  if ( ended ) {
    console.log( "complete!" );
    process.exit( 0 );
  }
}

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      stream = Make.find({
        updatedAt: null
      }).stream();

  stream.on( "data", function onData( doc ) {
    doc.updatedAt = doc.createdAt;
    doc.save( saveCallback );
  }).on( "error", function( err ) {
    process.exit( 1 );
  }).on( "end", function() {
    // simply ending here can break things because the stream ends before the last "data" callback.
    ended = true;
  });
});
