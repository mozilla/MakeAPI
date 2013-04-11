

module.exports = function routesCtor() {
  var makeRoutes = require( "./make" )();

  return {
    index: function( req, res ) {
      res.render( "index.html" );
    },
    upload: function( req, res ) {
      res.send( 200 );
    },
    search: function( req, res ) {
      res.render( "search.html" );
    },
    api_search: makeRoutes.search,
    api_create: makeRoutes.create,
    api_update: makeRoutes.update,
    api_remove: makeRoutes.remove
  };
};
