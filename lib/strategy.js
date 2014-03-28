/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( ApiApp, devMode ) {
  var DEVKEY = "00000000-0000-0000-000000000000",
      uuid = require( "uuid" );

  function devKeyLookupStrategy( publickey, callback ) {
    var credentials = {
      user: publickey,
      algorithm: "sha256"
    };
    if ( publickey === DEVKEY ) {
      credentials.key = DEVKEY;
      credentials.isAdmin = true;
    } else {
      // generate a fake password so that credential verification will fail
      credentials.key = uuid.v4();
    }
    callback( null, credentials );
  }

  function databaseKeyLookupStrategy( publickey, callback ) {
    var credentials = {
      algorithm: "sha256",
      user: publickey
    };
    ApiApp.findOne({ publickey: publickey }, function( err, doc ) {
      if ( err || !doc ) {
        return callback( err );
      }
      if ( doc.revoked ) {
        // only warn of revoked key if the passed MAC is successfully authenticated
        // see the hawk callback below
        req.revokedKey = true;
      }
      credentials.key = doc.privatekey;
      credentials.admin = doc.admin;
      callback( null, credentials );
    });
  }

  if ( devMode ) {
    return devKeyLookupStrategy;
  } else {
    return databaseKeyLookupStrategy;
  }
};
