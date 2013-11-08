/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This module uses the LoginAPI to translate a username into
 * an email address for the purpose of searching
 *
 * TODO: Obsolete this by storing username.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=936039
 */

module.exports = function( loginAPI ) {
  return function( options, callback ) {
    loginAPI.getUserByUsername( options.user, function( err, userData ) {
      if ( err ) {
        callback({ error: err, code: 500 });
        return;
      }

      // Check that a user object was found
      if ( !userData ) {
        if ( options.isOr ) {
          // If this is an OR filtered query, ignore the undefined user
          // because the search may return results for other fields in the query
          return callback( null, null );
        } else {
          // invalid username, 404 the request
          return callback( { code: 404 } );
        }
      }

      var filter = {
        "term": {
          email: userData.email
        }
      };

      if ( options.not ) {
        filter = {
          not: filter
        };
      }

      callback( null, filter );
    });
  };
};
