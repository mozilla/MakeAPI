/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( env ) {

  var userList = env.get( "ALLOWED_USERS" ),
      qs = require( "querystring" );

  userList = qs.parse( userList, ",", ":" );

  return {
    authenticateUser: function( user, pass ) {
      for ( var username in userList ) {
        if ( userList.hasOwnProperty( username ) ) {
          if ( user === username && pass === userList[ username ] ) {
            return true;
          }
        }
      }
      return false;
    }
  };
};
