/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( audience, login ) {

  return {
    admin: function( req, res ) {
      res.render( "admin.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.session._csrf
      });
    },
    login: function( req, res ) {
      res.render( "login.html", {
        email: req.session.email,
        audience: audience,
        login: login,
        csrf: req.session._csrf
      });
    }
  };
};
