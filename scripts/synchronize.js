var Habitat = require( "habitat" );

Habitat.load();

var config = new Habitat();

var db = require( "../lib/mongoose" )( config, function( err ) {
  if ( err ) {
    console.error( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( config, db.mongoInstance() );

  // Synchronize existing makes with Elastic Search
  var syncCount = 0;
  var syncStream = Make.synchronize();
  console.log( "Started MongoDB synchronization with ES" );
  syncStream.on( "data" , function() {
    syncCount++;
    if ( syncCount % 1000 === 0 ) {
      console.log( "Synced %d makes", syncCount );
    }
  });
  syncStream.on( "error" , function( err ) {
    console.log( "Failed to synchronize MongoDB with ES, shutting down" );
    console.log( err );
    process.exit( 1) ;
  });
  syncStream.on( "close", function() {
    console.log( "Synchronized %d makes", syncCount );
    console.log( "Synchronization complete" );
  });
});

