/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

var loginApi = require( "../lib/loginapi" );

module.exports = function( makeModel, env ) {

  var Make = makeModel,
      metrics = require( "../lib/metrics" )( env ),
      queryBuilder = require( "../lib/queryBuilder" )( loginApi ),
      deferred = require( "deferred" ),
      getUser = deferred.promisify( loginApi.getUser ),
      version = require( "../package" ).version;


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
        make[ field ] = body[ field ];
      }
    });

    if ( body.email ) {
      make.email = body.email;
    }

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

          if ( user ) {
            // Attach the Maker's username and return the result
            searchHit.username = user.username;
            searchHit.emailHash = user.emailHash;
          } else {
            // The user account was likely deleted.
            // We need cascading delete, so that this code will only be hit on rare circumstances
            // cron jobs can be used to clean up anything that slips through the cracks.
            searchHit.username = "";
            searchHit.emailHash = "";
          }

          return searchHit;
        }, function onError( err ) {
          handleError( res, err, 500, "search" );
        });
    })
    .then(function onSuccess( result ) {
      metrics.increment( "make.search.success" );
      res.json( { makes: result, total: results.total } );
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
      updateFields( res, req.make, req.body.make, "update" );
    },
    remove: function( req, res ) {
      var make = req.make;

      make.deletedAt = Date.now();
      make.save( function( err, make ) {
        if ( err ) {
          return handleError( res, err, 500, "remove" );
        }
        metrics.increment( "make.remove.success" );
        res.json( make );
      });
    },
    search: function( req, res ) {

      if ( !req.query ) {
        return handleError( res, "Malformed Request", 400, "search" );
      }

      queryBuilder.build( req.query, function( err, dsl ) {
        if ( err ) {
          if ( err.code === 404 ) {
            // No user was found, no makes to search.
            return res.json( { makes: [], total: 0 } );
          } else {
            return handleError( res, err.error, err.code, "search" );
          }
        }
        doSearch( res, dsl );
      });
    },
    searchTest: function( req, res ) {
      res.render( "search.html" );
    },
    healthcheck: function( req, res ) {
      res.json({
        http: "okay",
        version: version
      });
    }
  };
};
