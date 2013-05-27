/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( makeCtor, env ) {

  var Make = makeCtor,
      metrics = require( "../lib/metrics" )( env ),
      maker = require( "../lib/maker" )(),
      querystring = require( "querystring" ),
      deferred = require( "deferred" ),
      getUser = deferred.promisify( maker.getUser );

  function handleError( res, err, code, type ){
    metrics.increment( "make." + type + ".error" );
    res.json( code, { error: err } );
  }

  function handleSave( resp, err, make, type ){
    if ( err ) {
      handleError( resp, err, 400, type );
    } else {
      metrics.increment( "make." + type + ".success" );
      resp.json( make );
    }
  }

  function updateFields( res, make, body, type ) {
    Make.publicFields.forEach( function( field ) {
      make[ field ] = body[ field ] || null;
    });

    make.createdAt = Date.now();
    make.save(function( err, make ){
      return handleSave( res, err, make, type );
    });
  }

  function getUserNames( res, results ) {
    var searchHit;
    deferred.map( results.hits, function( make ) {
      return Make.pFindOne( { _id: make._id }, "email" )
      .then(function( withEmail ) {
        return getUser( withEmail.email )
        .then(function( result ) {
          searchHit = {};
          Make.publicFields.forEach(function( val ) {
            searchHit[ val ] = make[ val ];
          });
          searchHit.username = result.subdomain;
          return searchHit;
        });
      }, function( err ) {
        handleError( res, err, 500, "search" );
      });
    })
    .then(function( result ) {
      metrics.increment( "make.search.success" );
      res.json( result );
    }, function( err ) {
      handleError( res, err, 500, "search" );
    });
  }

  function doSearch( res, searchData ) {
    Make.search( searchData, function( err, results ) {
      if ( err ) {
        return handleError( res, err, 500, "search" );
      } else {
        getUserNames( res, results );
      }
    });
  }

  return {
    create: function( req, res ) {
      updateFields( res, new Make(), req.body.make, "create" );
    },
    update: function( req, res ) {
      Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {
        updateFields( res, make, req.body.make, "update" );
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

      if ( !searchData.query.filtered.filter.and ) {
        searchData.query.filtered.filter.and = [];
      }

      filters = searchData.query.filtered.filter.and;

      // We have to unescape any URLs that were present in the data
      for ( var i = 0; i < filters.length; i++ ) {
        filter = filters[ i ];
        if ( filter.term && filter.term.url ) {
          filter.term.url = querystring.unescape( filter.term.url );
        }
      }

      if ( searchData.makerID ) {
        return maker.getUser( searchData.makerID, function( err, userData ) {
          if ( err ) {
            return handleError( res, "Specified user does not exist", 400, "search" );
          }
          searchData.query.filtered.filter.and.push({
            term: {
              email: userData.email
            }
          });
          delete searchData.makerID;
          doSearch( res, searchData );
        });
      }

      doSearch( res, searchData );

    },
    healthcheck: function( req, res ) {
      res.json({ http: "okay" });
    }
  };
};
