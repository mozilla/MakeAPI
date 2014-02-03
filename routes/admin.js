/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( apiAppModel, audience, login ) {
  var uuid = require( "uuid" ),
      App = apiAppModel;

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
    login: function( req, res ) {
      res.render( "login.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.csrfToken()
      });
    },
    addApp: function( req, res ) {
      var newApp = req.body;

      if ( !newApp.contact ) {
        return res.json( 400, { error: "Missing data" } );
      }

      newApp.privatekey = uuid.v4();
      newApp.publickey = uuid.v4();
      newApp.revoked = false;
      newApp.admin = false;

      var app = new App( newApp );

      app.save(function( err, app ) {
        if ( err ) {
          res.json( 500, { error: err } );
        } else {
          res.json( { app: app } );
        }
      });
    }
  };
};
