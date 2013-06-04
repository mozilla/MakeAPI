/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( makeCtor, loginApi, env ) {

  var Make = makeCtor,
      metrics = require( "../lib/metrics" )( env ),
      querystring = require( "querystring" ),
      deferred = require( "deferred" ),
      getUser = deferred.promisify( loginApi.getUser );

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
      // only update if the field exists on the body
      if ( field in body ) {
        // arrays need to be concatenated to avoid overwriting elements in the original.
        if ( Array.isArray( make[ field ] ) ) {
          make[ field ] = make[ field ].concat( body[ field ] ).filter(function( tag, pos, arr ) {
            return arr.indexOf( tag ) === pos;
          });
        } else {
          make[ field ] = body[ field ];
        }
      }
    });

    make.email = body.email;

    // If createdAt doesn't exist, we know this is a Create, otherwise stamp updatedAt
    if ( !make.createdAt ) {
      make.createdAt = Date.now();
    } else {
      make.updatedAt = Date.now();
    }

    make.save(function( err, make ){
      return handleSave( res, err, make, type );
    });
  }

  function getUserNames( res, results ) {
    var searchHit;

    // Query for each Make's creator and attach their username to the Make
    deferred.map( results.hits, function( make ) {

      // Query the Login API for User data using the email attached to the Make
      return getUser( make.email )
        .then(function onSuccess( user ) {
          // Create new object and copy the makes public fields to it
          searchHit = {};
          Make.publicFields.forEach(function( val ) {
            searchHit[ val ] = make[ val ];
          });
          // _id, createdAt and updatedAt are not apart of our public fields.
          // We need to manually assign it to the object we are returning
          searchHit._id = make._id;
          searchHit.createdAt = make.createdAt;
          searchHit.updatedAt = make.updatedAt;

          // Attach the Maker's username and return the result
          searchHit.username = user.username;
          searchHit.emailHash = user.emailHash;
          return searchHit;
        }, function onError( err ) {
          handleError( res, err, 500, "search" );
        });
    })
    .then(function onSuccess( result ) {
      metrics.increment( "make.search.success" );
      res.json( result );
    }, function onError( err ) {
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
        return loginApi.getUser( searchData.makerID, function( err, userData ) {
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
