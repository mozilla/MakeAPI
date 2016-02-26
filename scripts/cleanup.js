#!/usr/bin/env node

/*
 * Run this script to delete makes that have been marked deleted more than 2 weeks before the current date
 */

var TWO_WEEKS = 1000*60*60*24*14;

var async = require( "async" );

dbh = require( "../lib/mongoose" )( function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var Make = require( "../lib/models/make" )( dbh.mongoInstance() ),
      numDeleted = 0,
      queue;

  Make.remove({
    deletedAt: {
      "$ne": null,
      "$lt": Date.now() - TWO_WEEKS
    }
  }, function( err ) {
    if ( err ) {
      console.error( "Error: ", err || "Makes array is null" );
      process.exit( 1 )
    }

    process.exit( 0 );
  });
});
