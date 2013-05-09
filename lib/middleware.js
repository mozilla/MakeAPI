/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( env ) {

  var qs = require( "querystring" ),
      userList = qs.parse( env.get( "ALLOWED_USERS" ), ",", ":" ),
      tags = require( "./tags" )(),
      maker = require( "./maker" )();

  return {
    // Use with express.basicAuth middleware
    authenticateUser: function( user, pass ) {
      var found = false;
      Object.keys( userList ).forEach( function( username ) {
        if ( user === username && pass === userList[ username ] ) {
          found = true;
        }
      });
      return found;
    },
    prefixAuth: function( req, res, next ) {

      if ( typeof req.body.make === "string" ) {
        req.body.make = qs.parse( req.body.make );
      }

      var makerID = req.body.maker,
          makeTags = req.body.make.tags,
          appTags = req.body.make.appTags;

      makeTags = typeof makeTags === "string" ? [makeTags] : makeTags;
      appTags = typeof appTags === "string" ? [appTags] : appTags;

      maker.isAdmin( makerID, function( err, isAdmin ) {
        if ( err ) {
          return res.json( 500, { error: err } );
        }

        var options = {
              maker: makerID,
              isAdmin: isAdmin
            },
            validTags = [];

        if ( makeTags ) {
           validTags = tags.validateTags( makeTags, options );
         }

        if ( appTags ) {
          validTags = validTags.concat( tags.validateApplicationTags( appTags, req.user ) );
        }

        req.body.make.tags = validTags;

        next();
      });
    }
  };
};
