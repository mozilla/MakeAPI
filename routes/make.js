"use strict";

var Make = require( "../lib/models/make" );

module.exports = function() {

  function handleError( resp, err, code ){
    // if ( code >= 500 ){
    //   logger.error( err );
    // }
    resp.writeHead( code, { "Content-Type": "application/json" } );
    resp.write( JSON.stringify( err ) );
    return resp.end();
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
        return resp.send( make );
      });
    },
    search: function( req, res ) {
      Make.search(req.body, function( err, results ){
        if ( err ) {
          return handleError( res, err, 500 );
        } else {
          return res.send( results );
        }
      });
    }
  };
};