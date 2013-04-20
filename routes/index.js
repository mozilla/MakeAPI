

module.exports = function routesCtor() {
  var makeRoutes = require( "./make" )();

  return {
    index: function( req, res ) {
      res.render( "index.html" );
    },
    upload: function( req, res ) {
      res.send( 200 );
    },
    search: makeRoutes.search,
    create: makeRoutes.create,
    update: makeRoutes.update,
    remove: makeRoutes.remove,
    findOne: makeRoutes.findById,
    healthcheck: makeRoutes.healthcheck
  };
};
