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
      sanitize = require( "../lib/sanitizer" ),
      version = require( "../package" ).version;

  function error( res, err, type, code ) {
    metrics.increment( "make." + type + ".error" );
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
        if ( field === "likes" ) {
          make.likes.push( body.likes );
        } else if ( field === "tags" ) {
          make.tags = body.tags.map( sanitize );
        } else {
          make[ field ] = body[ field ];
        }
      }
    });

    if ( body.email ) {
      make.email = body.email;
    }

    // if 'ownerApp' exists, this is an update, so pass over. 'ownerApp' should never change over the life of a make.
    if ( !make.ownerApp ) {
      // assign the make the public key [uuid] of the app that authenticated with the makeAPI
      make.ownerApp = req.credentials.user;
    }

    // If createdAt doesn't exist, we know this is a Create, otherwise stamp updatedAt
    if ( !make.createdAt ) {
      make.createdAt = make.updatedAt = Date.now();
    } else {
      make.updatedAt = Date.now();
    }

    make.save(function( err, make ) {
      return handleSave( req, res, err, make, type );
    });
  }

  function mapUsernames( makes, callback ) {
    var emails = makes.slice().map(function( hit ) {
      return hit._source.email;
    });

    loginApi.getUsernamesByEmails( emails, function( err, mappedUsers ) {
      if ( err ) {
        return callback( err );
      }

      makes = makes.map(function( esMake ) {
        var safeMake = {},
            source = esMake._source,
            userData = mappedUsers[ source.email ];

        Make.publicFields.forEach(function( val ) {
          safeMake[ val ] = source[ val ];
        });

        // _id, createdAt and updatedAt are not a part of our public fields.
        // We need to manually assign it to the object we are returning
        safeMake._id = esMake._id;
        safeMake.createdAt = source.createdAt;
        safeMake.updatedAt = source.updatedAt;

        safeMake.tags = source.tags.map( sanitize );

        if ( userData ) {
          // Attach the Maker's username and return the result
          safeMake.username = userData.username;
          safeMake.emailHash = userData.emailHash;
        } else {
          // The user account was likely deleted.
          // We need cascading delete, so that this code will only be hit on rare circumstances
          // cron jobs can be used to clean up anything that slips through the cracks.
          safeMake.username = "";
          safeMake.emailHash = "";
        }
        return safeMake;
      });
      callback( null, makes );
    });
  }

  function doSearch( req, res, authenticated ) {
    // Build Query DSL
    // authenticated indicates whether or not to include makes where published===false
    queryBuilder.search( req.query, function( err, dsl ) {
      if ( err ) {
        if ( err.code === 404 ) {
          // No user was found, no makes to search.
          metrics.increment( "make.search.success" );
          return res.json( { makes: [], total: 0 } );
        } else {
          return error( res, err, "search", err.code );
        }
      }
      // Instruct mongoostastic to run the DSL against the Elastic Search endpoint
      Make.search( dsl, function( err, results ) {
        var searchResults;
        if ( err ) {
          error( res, "The query produced invalid ElasticSearch DSL. Query URL: " + req.url, "search", 500 );
        } else {
          searchResults = results.hits;
          mapUsernames( searchResults.hits, function( err, mappedMakes ) {
            if ( err ) {
              return error( res, err, "search", 500 );
            }
            metrics.increment( "make.search.success" );
            res.json( { makes: mappedMakes, total: searchResults.total } );
          });
        }
      });
    }, authenticated );
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
        return error( res, "Malformed Request", "search", 400 );
      }
      doSearch( req, res, false );
    },
    protectedSearch: function( req, res ) {
      if ( !req.query ) {
        return error( res, "Malformed Request", "search", 400 );
      }
      doSearch( req, res, true );
    },
    remixCount: function( req, res ) {
      if ( !req.query || !req.query.id ) {
        return error( res, "Malformed Request", "remixCount", 400 );
      }
      var id = req.query.id,
          from = req.query.from || 0,
          to = req.query.to || Date.now();

      queryBuilder.remixCount( id, from, to, function( err, dsl ) {
        if ( err ) {
          return error( res, err, "remixCount", err.code );
        }
        Make.search( dsl, function( err, results ) {
          return res.json({ count: results.hits.total });
        });
      });
    },
    autocomplete: function( req, res ) {
      if ( !req.query.t ) {
        return error( res, "Autocomplete term required", "autocomplete", 400 );
      }
      var query = queryBuilder.autocomplete( req.query.t, req.query.s );
      Make.search( query, function( err, results ) {
        if ( err ) {
          error( res, err, "autocomplete", 500 );
        } else {
          metrics.increment( "make.autocomplete.success" );
          res.json({
            tags: results.facets.tags.terms,
            total: results.facets.tags.terms.length
          });
        }
      });
    },
    healthcheck: function( req, res ) {
      res.json({
        http: "okay",
        version: version
      });
    }
  };
};
