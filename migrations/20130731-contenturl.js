/* This script will update all makes in the database with their contenturl value
 * It is assumed that the schema change has already been applied in the code,
 * the .env file contains a proper database configuration file, and that
 * your mongo daemon is running.
 *
 * run this script from the root of the project like so:
 * node migrations/20130731-contenturl <static_data_store_value>
 */

var habitat = require( "habitat" ),
    url = require( "url" ),
    staticDataStore = process.argv[ 2 ],
    ended = false,
    env,
    mongoose;

habitat.load();

env = new habitat();

if ( !staticDataStore ) {
  console.log( "You must provide a static data store value as an argument when invoking this script" );
  process.exit( 1 );
}

function generateContentURL( vanityUrl ) {
  vanityUrl = url.parse( vanityUrl );
  return url.resolve( staticDataStore, vanityUrl.hostname.split( "." )[ 0 ] + vanityUrl.path );
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
    if ( doc.contenturl ) {
      return;
    }
    doc.contenturl = generateContentURL( doc.url );
    doc.save( saveCallback );
  }).on( "error", function( err ) {
    process.exit( 1 );
  }).on( "end", function() {
    // simply ending here can break things because the stream ends before the last "data" callback.
    ended = true;
  });
});
