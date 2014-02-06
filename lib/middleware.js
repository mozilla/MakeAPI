/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loginApi = require( "./loginapi" );
var http = require( "http" );

module.exports = function( makeModel, apiUserModel, env ) {
  var qs = require( "querystring" ),
      hawkModule = require( "./hawk" )(),
      tags = require( "./tags" )(),
      Make = makeModel,
      hawkOptions = {},
      credentialsLookupStrategy = require( "./strategy" )( apiUserModel, env.get( "USE_DEV_KEY_LOOKUP" ) );

  // API Key write permissions feature flag
  var ENFORCE_WRITE_PERMISSIONS = env.get( "ENFORCE_WRITE_PERMISSIONS" );

  // fields that collaborator accounts can update
  var COLLABORATOR_FIELDS = [
    "tags"
  ];

  if ( env.get( "FORCE_SSL" ) ) {
    hawkOptions.port = 443;
  }

  function findUserElem( id, array ) {
    var elem;
    for ( var i = array.length - 1; i >= 0; i-- ) {
      elem = array[ i ];
      if ( elem.userId === id ) {
        return elem;
      }
    }
    return null;
  }

  return {
    prefixAuth: function( req, res, next ) {

      // Support older POST body formats for Makes
      if ( req.body.maker && req.body.make ) {
        req.body = req.body.make;
      }

      var email = req.body.email,
          makeTags = req.body.tags,
          appTags = req.body.appTags,
          make = req.make;

      makeTags = typeof makeTags === "string" ? [makeTags] : makeTags;
      appTags = typeof appTags === "string" ? [appTags] : appTags;

      function processTags( isAdmin ) {
        var validTags = [];

        if ( makeTags ) {
          validTags = tags.validateTags( makeTags, email, isAdmin );
        }

        if ( appTags ) {
          validTags = validTags.concat( tags.validateApplicationTags( appTags, req.user ) );
        }

        // Preserve Application Tags on the original make & filter duplicates
        if ( make && make.tags ) {
          validTags = validTags.concat( make.tags.filter(function( tag ) {
            return ( /(^[^@]+)\:[^:]+/ ).test( tag );
          })).filter(function( tag, pos, arr ) {
            return arr.indexOf( tag ) === pos;
          });
        }

        req.body.tags = validTags;

        next();
      }

      if ( email ) {
        loginApi.getUserByEmail( email, function( err, user ) {
          if ( err ) {
            return hawkModule.respond( 500, res, req.credentials, req.artifacts, { status: "failure", reason: err }, "application/json" );
          }
          processTags( user ? user.isAdmin : false );
        });
      } else {
        processTags( false );
      }
    },
    adminAuth: function( req, res, next ) {
      var id = req.session ? req.session.id : "";
      if ( id ) {
        loginApi.getUserById( id, function( err, user ) {
          if ( err ) {
            return next( err );
          }
          if ( !user || !user.isAdmin ) {
            return res.redirect( 302, "/login" );
          }
          next();
        });
      } else {
        res.redirect( 302, "/login" );
      }
    },
    collabAuth: function( req, res, next ) {
      var id = req.session ? req.session.id : "";
      if ( id ) {
        loginApi.getUserById( id, function( err, user ) {
          if ( err ) {
            return next( err );
          }
          if ( !user.isCollaborator && !user.isAdmin ) {
            return res.redirect( 302, "/login" );
          }
          req.isCollab = user.isCollaborator;
          next();
        });
      } else {
        res.redirect( 302, "/login" );
      }
    },
    hawkAuth: function( req, res, next ) {
      hawkModule.Hawk.server.authenticate( req, credentialsLookupStrategy, hawkOptions, function( err, creds, artifacts ) {
        var msg;
        if ( err || req.revokedKey ) {
          msg = err ? "Unauthorized" : "Your Key has been revoked, contact a MakeAPI administrator.";
          return hawkModule.respond( 401, res, creds, artifacts, { status: "failure", reason: msg }, "application/json" );
        }
        req.credentials = creds;
        req.artifacts = artifacts;
        next();
      });
    },
    getMake: function( req, res, next ) {
      if ( !req.params.id ) {
        return hawkModule.respond( 400, res, req.credentials, req.artifacts, { status: "failure", reason: "ID missing" }, "application/json" );
      }
      Make.findById( req.params.id ).where( "deletedAt", null ).exec(function( err, make ) {
        if ( err ) {
          if ( err.name === "CastError" ) {
            return hawkModule.respond( 400, res, req.credentials, req.artifacts, { status: "failure", reason: "The supplied value does not look like a Make ID." }, "application/json" );
          } else {
            return hawkModule.respond( 500, res, req.credentials, req.artifacts, { status: "failure", reason: err.toString() }, "application/json" );
          }
        }
        if ( !make ) {
          return hawkModule.respond( 400, res, req.credentials, req.artifacts, { status: "failure", reason: "Make Does Not Exist" }, "application/json" );
        }
        req.make = make;
        next();
      });
    },
    report: function( req, res, next ) {
      var make = req.make;
      loginApi.getUserByUsername( req.body.maker, function( err, user ) {
        if ( err ) {
          return next( err );
        }
        var report = findUserElem( user.id, make.reports );
        if ( !report ) {
          make.reports.push({
            userId: user.id
          });
          next();
        } else {
          next({
            status: 400,
            message: "User already reported this make"
          });
        }
      });
    },
    cancelReport: function( req, res, next ) {
      var make = req.make;

      loginApi.getUserByUsername( req.body.maker, function( err, user ) {
        if ( err ) {
          return next( err );
        }
        var report = findUserElem( user.id, make.reports );
        if ( report ) {
          make.reports.splice( make.reports.indexOf( report ), 1 );
          next();
        } else {
          next({
            status: 400,
            message: "User has not reported this make"
          });
        }
      });
    },
    fieldFilter: function( req, res, next ) {
      var sanitizedUpdate = {};
      if ( req.isCollab ) {
        COLLABORATOR_FIELDS.forEach(function( safeField ) {
          sanitizedUpdate[ safeField ] = req.body[ safeField ];
        });
        req.body = sanitizedUpdate;
      }
      next();
    },
    like: function( req, res, next ) {
      var make = req.make;
      loginApi.getUserByUsername( req.body.maker, function( err, user ) {
        if ( err ) {
          return next( err );
        }
        var userLike = findUserElem( user.id, make.likes );
        if ( !userLike ) {
          make.likes.push({
            userId: user.id
          });
          next();
        } else {
          next({
            status: 400,
            message: "User already Likes"
          });
        }
      });
    },
    unlike: function( req, res, next ) {
      var make = req.make;
      loginApi.getUserByUsername( req.body.maker, function( err, user ) {
        if ( err ) {
          return next( err );
        }
        var userLike = findUserElem( user.id, make.likes );
        if ( userLike ) {
          make.likes.splice( make.likes.indexOf( userLike ), 1 );
          next();
        } else {
          next({
            status: 400,
            message: "User does not like"
          });
        }
      });
    },
    checkMakeOwner: function( req, res, next ) {

      // Don't enforce write permissions if not enabled.
      if ( !ENFORCE_WRITE_PERMISSIONS ) {
        return next();
      }

      var make = req.make,
          user = req.credentials.user;
      // check if the authenticated application has admin permissions, or if it owns the make
      if ( req.credentials.admin !== true && user !== make.ownerApp ) {
        return hawkModule.respond( 403, res, req.credentials, req.artifacts, {
                 status: "failure",
                 reason: "unauthorized"
               }, "application/json" );
      }
      next();
    },
    crossOrigin: function( req, res, next ) {
      res.header( "Access-Control-Allow-Origin", "*" );
      next();
    },
    errorHandler: function(err, req, res, next) {
      if (typeof err === "string") {
        console.error("You're passing a string into next(). Go fix this: %s", err);
      }

      var error = {
        message: err.toString(),
        status: http.STATUS_CODES[err.status] ? err.status : 500
      };

      res.status(error.status);
      res.json(error);
    },
    fourOhFourHandler: function(req, res, next) {
      var err = {
        message: "You found a loose thread!",
        status: 404
      };

      res.status(err.status);
      res.json(err);
    }
  };
};
