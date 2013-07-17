/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( env ) {
  var express = require( "express" ),
      qs = require( "querystring" ),
      userList = qs.parse( env.get( "ALLOWED_USERS" ), ",", ":" );

  return express.basicAuth(function( user, pass ) {
    var found = false;
    Object.keys( userList ).forEach( function( username ) {
      if ( user === username && pass === userList[ username ] ) {
        found = true;
      }
    });
    return found;
  });
};
