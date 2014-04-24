/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var env = require( "../lib/environment" );

module.exports = function routesCtor( makeModel, apiAppModel ) {
  var makeRoutes = require( "./make" )( makeModel ),
      adminRoutes = require( "./admin" )( apiAppModel );

  return {
    index: function( req, res ) {
      res.send( "Hello world!" );
    },
    search: makeRoutes.search,
    getUserLikes: makeRoutes.getUserLikes,
    protectedSearch: makeRoutes.protectedSearch,
    remixCount: makeRoutes.remixCount,
    autocomplete: makeRoutes.autocomplete,
    create: makeRoutes.create,
    update: makeRoutes.update,
    remove: makeRoutes.remove,
    healthcheck: makeRoutes.healthcheck,
    admin: adminRoutes.admin,
    login: adminRoutes.login,
    addApp: adminRoutes.addApp
  };
};
