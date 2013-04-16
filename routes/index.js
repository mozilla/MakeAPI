

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
