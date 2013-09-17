/* This script will update all makes in the database with a owner field, based on the contentType.
 * It is assumed that the schema change has already been applied in the code,
 * the .env file contains a proper database configuration file, and that
 * your mongo daemon is running.
 *
 * run this script from the root of the project like so:
 * node migrations/20130917-owner <content type> <owner public key>
 */

var habitat = require( "habitat" ),
    contentType = process.argv[ 2 ],
    publicKey = process.argv[ 3 ],
    ended = false,
    env,
    mongoose;

habitat.load();

env = new habitat();

if ( !contentType || !publicKey ) {
  console.log( "You must provide a contentType and public key as arguments when invoking this script" );
  process.exit( 1 );
}

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
      stream = Make.find().stream();

  stream.on( "data", function onData( doc ) {
    if ( doc.owner || doc.contentType !== contentType ) {
      return;
    }
    doc.owner = publicKey;
    doc.save( saveCallback );
  }).on( "error", function( err ) {
    process.exit( 1 );
  }).on( "end", function() {
    // simply ending here can break things because the stream ends before the last "data" callback.
    ended = true;
  });
});
