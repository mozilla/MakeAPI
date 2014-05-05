var async = require( "async" );
var Habitat = require( "habitat" );

Habitat.load();

var config = new Habitat();

var Mongo = require( "../lib/mongoose" )();
var Make = require( "../lib/models/make" )( Mongo.mongoInstance() );

var criteria = process.argv[2] ? JSON.parse(process.argv[2]) : {};

  var q = async.queue( function( doc, done ) {
    doc.index( done );
  }, 2);
  q.drain = function() {
    console.log( "Done indexing %d records from Mongo", indexedRecords );
    Mongo.mongoInstance().connection.close();
  };

  var indexedRecords = 0;
  var stream = Make.find(criteria).stream();
  stream.on( "data", function( doc ) {
    q.push( doc, function( err ) {
      if ( err ) {
        throw err;
      }

      indexedRecords++;
      if ( indexedRecords % 100 === 0 ) {
        console.log( "Indexed %d records", indexedRecords );
      }
    });
  });
  stream.on( "error", function ( err ) {
    throw err;
  });
  stream.on( "end", function() {
    console.log( "Done streaming records from Mongo" );

    if (indexedRecords === 0) {
      console.log("No records matching '%j' found", criteria);
      Mongo.mongoInstance().connection.close();
    }
  });
