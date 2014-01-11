/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( apiUserModel, audience, login ) {
  var uuid = require( "uuid" ),
      ApiUser = apiUserModel;
  return {
    admin: function( req, res ) {
      res.render( "admin.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.csrfToken(),
        iscollaborator: req.isCollab ? 1 : 0
      });
    },
    metricAdmin: function( req, res ) {
       res.render( "metrics.html", {
         email: req.session.email,
         audience: audience,
         login: login,
         csrf: req.csrfToken(),
         iscollaborator: req.isCollab ? 1 : 0
       });
     },
    login: function( req, res ) {
      res.render( "login.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.csrfToken()
      });
    },
    addUser: function( req, res ) {
      var newUser = req.body;

      if ( !newUser.contact ) {
        return res.json( 400, { error: "Missing data" } );
      }

      newUser.privatekey = uuid.v4();
      newUser.publickey = uuid.v4();
      newUser.revoked = false;
      newUser.admin = false;

      var user = new ApiUser( newUser );

      user.save(function( err, user ) {
        if ( err ) {
          res.json( 500, { error: err } );
        } else {
          res.json( { user: user } );
        }
      });
    }
  };
};
