/* This script will update all makes in the database with a remixurl and editurl field
 *
 * run this script from the root of the project like so:
 * node migrations/20131009-remix-edit-url
 */

var habitat = require( "habitat" ),
    async = require( "async" ),
    mongoStreamEnded = false,
    concurrency = process.argv[ 2 ] || 4,
    env,
    mongoose;

habitat.load();

env = new habitat();

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      stream = Make.find({
        $or: [{
          remixurl: null
        }, {
          editurl: null
        }]
      }).stream(),
      queue = async.queue(function( doc, done ) {
        doc.remixurl = doc.url + "/remix";
        doc.editurl = doc.url + "/edit";

        doc.save(function( err ) {
          if ( err ) {
            console.log( "Failure saving document:" );
            console.log( doc );
            console.log( err );
            process.exit( 1 );
          }
          done();
        });
      }, concurrency );;

  queue.drain = function() {
    if ( mongoStreamEnded ) {
      console.log( "completed!" );
      process.exit( 0 );
    }
  };

  stream.on( "data", function onData( doc ) {
    queue.push( doc );
  }).on( "error", function( err ) {
    console.log( err );
    process.exit( 1 );
  }).on( "end", function() {
    mongoStreamEnded = true;
  });
});
