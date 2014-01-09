/* This script will update all makes in the database with a ownerApp field, based on the contentType.
 * It is assumed that the schema change has already been applied in the code,
 * the .env file contains a proper database configuration file, and that
 * your mongo daemon is running.
 *
 * run this script from the root of the project like so:
 * node migrations/20130917-ownerApp <content type> <owner public key> <Concurrency>
 */

var habitat = require( "habitat" ),
    async = require( "async" ),
    contentType = process.argv[ 2 ],
    publicKey = process.argv[ 3 ],
    concurrency = process.argv[ 4 ] || 4,
    mongoStreamEnded = false,
    env,
    mongoose;

habitat.load();

env = new habitat();

if ( !contentType || !publicKey ) {
  console.log( "You must provide a contentType and public key as arguments when invoking this script" );
  process.exit( 1 );
}

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( JSON.stringify( err, null, 2 ) );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      stream = Make.find({
        "contentType": contentType,
        "ownerApp": null
      }).stream(),
      queue = async.queue(function( doc, done ) {
        doc.ownerApp = publicKey;
        doc.save(function( err ) {
          if ( err ) {
            console.error( "Failure saving document:" );
            console.log( JSON.stringify( doc, null, 2 ) );
            console.log( JSON.stringify( err, null, 2 ) );
            process.exit( 1 );
          }
          done();
        });
      }, concurrency );

  queue.drain = function() {
    if ( mongoStreamEnded ) {
      console.log( "completed!" );
      process.exit( 0 );
    }
  };

  stream.on( "data", function onData( doc ) {
    queue.push( doc );
  }).on( "error", function( err ) {
    console.log( JSON.stringify( err, null, 2 ) );
    process.exit( 1 );
  }).on( "end", function() {
    mongoStreamEnded = true;
  });
});
