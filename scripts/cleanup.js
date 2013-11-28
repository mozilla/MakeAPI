#!/usr/bin/env node

/*
 * Run this script to delete makes that have been marked deleted more than 2 weeks before the current date
 */

var TWO_WEEKS = 1000*60*60*24*14;

var habitat = require( "habitat" ),
    async = require( "async" ),
    mongoose,
    env;

habitat.load();

env = new habitat();

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( env, dbh.mongoInstance() ),
      numDeleted = 0,
      queue;

  Make.find({
    deletedAt: {
      "$ne": null,
      "$lt": Date.now() - TWO_WEEKS
    }
  }, function( err, makes ) {
    if ( err || !makes ) {
      console.error( "Error: ", err || "Makes array is null" );
      process.exit( 1 )
    }

    if ( !makes.length ) {
      console.log( "No Makes to Delete" );
      process.exit( 0 );
    }

    queue = async.queue(function( make, callback ) {
      make.remove(function( err ) {
        callback( err || null );
      });
    }, 1 );

    queue.drain = function() {
      console.log( numDeleted + " Makes deleted successfully." );
      process.exit( 0 );
    };

    queue.push( makes, function( err ) {
      if ( err ) {
        return console.error( "Error Deleting Make: ", err );
      }
      numDeleted++;
    });
  });
});
