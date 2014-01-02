/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function routesCtor( makeModel, apiUserModel, env ) {
  var makeRoutes = require( "./make" )( makeModel, env ),
      adminRoutes = require( "./admin" )( apiUserModel, env.get( "AUDIENCE" ), env.get( "LOGIN_SERVER" ) );

  return {
    index: function( req, res ) {
      res.send( "Hello world!" );
    },
    search: makeRoutes.search,
    remixCount: makeRoutes.remixCount,
    create: makeRoutes.create,
    update: makeRoutes.update,
    remove: makeRoutes.remove,
    healthcheck: makeRoutes.healthcheck,
    admin: adminRoutes.admin,
    login: adminRoutes.login,
    addUser: adminRoutes.addUser
  };
};
