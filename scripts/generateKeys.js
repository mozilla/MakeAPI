/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Invoke by calling:
// node generateKeys <email@address.com:STRING> <NumberOfKeys:INT> <isAdmin:BOOL>

var habitat = require( "habitat" ),
    uuid = require( "uuid" ),
    async = require( "async" ),
    dbh;

habitat.load();

var env = new habitat(),
    contactEmail = process.argv[ 2 ],
    numPairs = +process.argv[ 3 ],
    isAdmin = process.argv[ 4 ] === "true";

if ( !contactEmail || typeof contactEmail !== "string" || isNaN( numPairs ) || !numPairs ) {
  console.log( "Invalid CONTACT_EMAIL or NUM_KEY_PAIRS" );
  process.exit( 1 );
}

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var ApiUser = require( "../lib/models/apiUser" )( env, dbh.mongoInstance() ),
      users = [];

  for ( var i = 0; i < numPairs; i++ ) {
    users.push( new ApiUser({
      contact: contactEmail,
      privatekey: uuid.v4(),
      publickey: uuid.v4(),
      revoked: false,
      admin: !!isAdmin
    }));

  }

  async.eachSeries( users, function( user, cb ) {
    user.save(function( err, user ){
      if ( err ) {
        return cb( err );
      }
      console.log( "Keys generated for " + contactEmail
                   + " PRIVATEKEY: " + user.privatekey
                   + " PUBLICKEY: " + user.publickey
                   + " Is Admin: " + isAdmin ? "true" : "false" );
      cb();
    });
  }, function done( err ) {
    if ( err ) {
      console.log( "Something went horribly wrong saving: ", err );
      process.exit( 1 );
    }
    process.exit();
  });
});
