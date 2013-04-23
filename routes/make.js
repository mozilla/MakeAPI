"use strict";

var Make;

module.exports = function( makeCtor ) {

  Make = makeCtor;

  function handleError( res, err, code ){
    return res.json( { error: err }, code );
  }

  function handleSave( resp, err, make ){
    if ( err ) {
      return handleError( resp, err, 400 );
    } else {
      return resp.send( make );
    }
  }

  return {
    create: function( req, res ) {
      var make = new Make();

      for ( var i in Make.publicFields ){
        var field = Make.publicFields[ i ];
        make[ field ] = req.body[ field ];
      }

      make.save(function( err, make ){
        return handleSave( res, err, make );
      });
    },
    update: function( req, res ) {
      Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {
        for ( var i in Make.publicFields ) {
          var field = Make.publicFields[ i ];
          if ( req.body[ field ] ) {
            make[ field ] = req.body[ field ];
          }
        }
        make.updatedAt = ( new Date() ).getTime();

        make.save(function( err, make ){
          return handleSave( res, err, make );
        });
      });
    },
    remove: function( req, res ) {
      return Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {
        if ( err ) {
          if ( err.name === "CastError" ) {
            err.message = "The supplied value does not look like a Make ID.";
            return handleError( res, err, 400 );
          } else {
            return handleError( res, err, 500 );
          }
        }

        if ( make ) {
          make.deletedAt = ( new Date() ).getTime();
          make.save(function( err, make ) {
            if ( err ) {
              return handleError( res, err, 500 );
            }
          });
        }
        return res.send( make );
      });
    },
    search: function( req, res ) {
      var searchData, filters, filter;

      if ( !req.query[ "s" ] ) {
        return handleError( res, "Malformed Request", 400 );
      }

      searchData = JSON.parse( req.query[ "s" ] );
      filters = searchData.query.filtered.filter.and;

      // We have to unescape any URLs that were present in the data
      for ( var i = 0; i < filters.length; i++ ) {
        filter = filters[ i ];
        if ( filter.term && filter.term.url ) {
          filter.term.url = require( "querystring" ).unescape( filter.term.url );
        }
      }

      Make.search( searchData, function( err, results ) {
        if ( err ) {
          return handleError( res, err, 500 );
        } else {
          return res.send( results );
        }
      });
    },
    healthcheck: function( req, res ) {
      res.json({ http: "okay" });
    }
  };
};
