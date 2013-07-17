/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

var loginApi = require( "../lib/loginapi" );

module.exports = function( makeModel, env ) {

  var Make = makeModel,
      hawkModule = require( "../lib/hawk" )(),
      metrics = require( "../lib/metrics" )( env ),
      queryBuilder = require( "../lib/queryBuilder" )( loginApi ),
      deferred = require( "deferred" ),
      getUser = deferred.promisify( loginApi.getUser ),
      version = require( "../package" ).version;

  function searchError( res, err, code ) {
    metrics.increment( "make.search.error" );
    res.json( code, { error: err } );
  }

  function hawkError( req, res, err, code, type ){
    metrics.increment( "make." + type + ".error" );
    hawkModule.respond( code, res, req.credentials, req.artifacts, { status: "failure", reason: err }, "application/json" );
  }

  function handleSave( req, res, err, make, type ){
    if ( err ) {
      hawkError( req, res, err, 400, type );
    } else {
      metrics.increment( "make." + type + ".success" );
      hawkModule.respond( 200, res, req.credentials, req.artifacts, make, "application/json" );
    }
  }

  function updateFields( req, res, make, body, type ) {
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
      return handleSave( req, res, err, make, type );
    });
  }

  function getUserNames( req, res, results ) {
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
          searchError( res, err, 500 );
        });
    })
    .then(function onSuccess( result ) {
      metrics.increment( "make.search.success" );
      res.json( { makes: result, total: results.total } );
    }, function onError( err ) {
      searchError( res, err, 500 );
    });
  }

  function doSearch( req, res, searchData ) {
    Make.search( searchData, function( err, results ) {
      if ( err ) {
        searchError( res, err, 500 );
      } else {
        getUserNames( req, res, results );
      }
    });
  }

  return {
    create: function( req, res ) {
      updateFields( req, res, new Make(), req.body, "create" );
    },
    update: function( req, res ) {
      updateFields( req, res, req.make, req.body, "update" );
    },
    remove: function( req, res ) {
      var make = req.make;

      make.deletedAt = Date.now();
      make.save( function( err, make ) {
        if ( err ) {
          return hawkError( req, res, err, 500, "remove" );
        }
        metrics.increment( "make.remove.success" );
        hawkModule.respond( 200, res, req.credentials, req.artifacts, make, "application/json" );
      });
    },
    search: function( req, res ) {

      if ( !req.query ) {
        return searchError( res, "Malformed Request", 400 );
      }

      queryBuilder.build( req.query, function( err, dsl ) {
        if ( err ) {
          if ( err.code === 404 ) {
            // No user was found, no makes to search.
            metrics.increment( "make.search.success" );
            return res.json( { makes: [], total: 0 } );
          } else {
            return searchError( res, err, err.code );
          }
        }
        doSearch( req, res, dsl );
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
