/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Invoke by calling:
// node setAdmin <publicKey:String> <admin:1|0>

var habitat = require( "habitat" ),
    uuid = require( "uuid" ),
    async = require( "async" ),
    dbh;

habitat.load();

var env = new habitat(),
    pubKey = process.argv[ 2 ],
    admin = process.argv[ 3 ];

admin = admin && +admin === 1 ? true : false;

if ( !pubKey || typeof pubKey !== "string" ) {
  console.error( "Invalid Public Key" );
  process.exit( 1 );
}

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.error( "Error connecting to Database: ", err );
    process.exit( 1 );
  }

  var ApiUser = require( "../lib/models/apiUser" )( env, dbh.mongoInstance() );

  ApiUser.findOne({ publickey: pubKey }, function( err, doc ) {
    if ( err ) {
      console.error( "Error looking up key: " + err );
      process.exit( 1 );
    }
    if ( !doc ) {
      console.error( "That Public Key does not exist" );
      process.exit( 1 );
    }

    doc.admin = admin;

    doc.save(function( err ) {
      if ( err ) {
        console.error( "Error saving model: ", err );
        process.exit( 1 );
      }
      console.log( "Update Saved" );
      process.exit();
    });
  });
});
