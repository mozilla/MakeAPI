/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( makeCtor, env ) {

  var Make = makeCtor,
      metrics = require( "../lib/metrics" )( env ),
      querystring = require( "querystring" );

  function handleError( res, err, code, type ){
    metrics.increment( "make." + type + ".error" );
    return res.json( { error: err }, code );
  }

  function handleSave( resp, err, make, type ){
    if ( err ) {
      handleError( resp, err, 400, type );
    } else {
      metrics.increment( "make." + type + ".success" );
      resp.json( make );
    }
  }

  return {
    create: function( req, res ) {
      var make = new Make();

      for ( var i in Make.publicFields ){
        var field = Make.publicFields[ i ];
        make[ field ] = req.body[ field ];
      }

      make.createdAt = Date.now();

      make.save(function( err, make ){
        return handleSave( res, err, make, "create" );
      });
    },
    update: function( req, res ) {
      Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {

        if ( err ) {
          return handleError( res, "Unable to query user database", 500, "update" );
        }

        if ( !make ) {
          return handleError( res, "This record doesn't exist.", 404, "update" );
        }

        for ( var i in Make.publicFields ) {
          var field = Make.publicFields[ i ];
          if ( req.body[ field ] ) {
            make[ field ] = req.body[ field ];
          }
        }
        make.updatedAt = ( new Date() ).getTime();

        make.save(function( err, make ){
          handleSave( res, err, make, "update" );
        });
      });
    },
    remove: function( req, res ) {
      return Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {
        if ( err ) {
          if ( err.name === "CastError" ) {
            err.message = "The supplied value does not look like a Make ID.";
            return handleError( res, err, 400, "remove" );
          } else {
            return handleError( res, err, 500, "remove" );
          }
        }

        if ( !make ) {
          return handleError( res, "The supplied id does not exist.", 404, "remove" );
        }

        make.deletedAt = Date.now();
        make.save( function( err, make ) {
          if ( err ) {
            return handleError( res, err, 500, "remove" );
          }
          metrics.increment( "make.remove.success" );
          res.json( make );
        });
      });
    },
    search: function( req, res ) {
      var searchData, filters, filter;

      if ( !req.query.s ) {
        return handleError( res, "Malformed Request", 400, "search" );
      }

      try {
        searchData = JSON.parse( req.query.s );
      } catch ( err ) {
        return handleError ( res, "Unable to parse search data.", 400, "search" );
      }
      filters = searchData.query.filtered.filter.and;

      // We have to unescape any URLs that were present in the data
      for ( var i = 0; i < filters.length; i++ ) {
        filter = filters[ i ];
        if ( filter.term && filter.term.url ) {
          filter.term.url = querystring.unescape( filter.term.url );
        }
      }

      Make.search( searchData, function( err, results ) {
        if ( err ) {
          return handleError( res, err, 500, "search" );
        } else {
          metrics.increment( "make.search.success" );
          res.json( results );
        }
      });
    },
    healthcheck: function( req, res ) {
      res.json({ http: "okay" });
    }
  };
};
