/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


module.exports = function routesCtor( MakeCtor ) {
  var makeRoutes = require( "./make" )( MakeCtor );

  return {
    index: function( req, res ) {
      res.render( "index.html" );
    },
    search: makeRoutes.search,
    create: makeRoutes.create,
    update: makeRoutes.update,
    remove: makeRoutes.remove,
    healthcheck: makeRoutes.healthcheck
  };
};
