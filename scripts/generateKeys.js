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

  var ApiApp = require( "../lib/models/apiApp" )( env, dbh.mongoInstance() ),
      apps = [];

  for ( var i = 0; i < numPairs; i++ ) {
    apps.push( new ApiApp({
      contact: contactEmail,
      privatekey: uuid.v4(),
      publickey: uuid.v4(),
      revoked: false,
      admin: !!isAdmin // This means "Internal Webmaker"
    }));

  }

  async.eachSeries( apps, function( app, cb ) {
    app.save(function( err, app ){
      if ( err ) {
        return cb( err );
      }
      console.log( "Keys generated for %s\nPRIVATEKEY: %s\nPUBLICKEY: %s\nadmin: %s",
                   contactEmail, app.privatekey, app.publickey, isAdmin );
      cb();
    });
  }, function done( err ) {
    if ( err ) {
      console.log( "Something went horribly wrong saving: ", err );
      return process.exit( 1 );
    }
    process.exit();
  });
});
