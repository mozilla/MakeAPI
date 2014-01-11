/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function() {

      // Application Tags are "webmaker.org:foo", which means two
      // strings, joined with a ':', and the first string does not
      // contain an '@'
      var appTagRegex = /(^[^@]+)\:[^:]+/,

      // User Tags are "some@something.com:foo", which means two
      // strings, joined with a ':', and the first string contains
      // an email address (i.e., an '@').
      userTagRegex = /^([^@]+@[^@]+)\:[^:]+/,

      // Raw Tags are "foo" or "#fooBar", which means one string
      // which does not include a colon.
      rawTagRegex = /^[^:]+$/,

      // Trim any whitespace around tags
      trimWhitespace = function( tags ) {
        return tags.map(function( val ) {
          return val.trim();
        });
      };

  return {
    validateTags: function( tags, email, isAdmin ) {

      var user;

      tags = trimWhitespace( tags );

      return tags.filter(function( val ){

        // allow if user is an admin, or val is a raw tag
        if ( isAdmin || rawTagRegex.test( val ) ) {
          return true;
        }

        user = userTagRegex.exec( val );

        // Allow if val is a user tag, and user is logged in
        if ( email && user && user[ 1 ] === email ) {
          return true;
        }

        return false;
      });
    },
    validateApplicationTags: function( tags, application ) {

      var appTag;

      tags = trimWhitespace( tags );

      return tags.filter(function( val ) {
        appTag = appTagRegex.exec( val );

        // Allow if is application tag, and the application tag matches the
        // username of the app making the request
        if ( appTag && appTag[ 1 ] === application ) {
          return true;
        }

        return false;
      });
    }
  };
};
