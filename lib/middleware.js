/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loginApi = require( "./loginapi" );

module.exports = function( makeModel, apiUserModel, env ) {
  var qs = require( "querystring" ),
      hawkModule = require( "./hawk" )(),
      tags = require( "./tags" )(),
      Make = makeModel,
      ApiUser = apiUserModel,
      lazyCheck = env.get( "USE_LAZY_ADMIN" );

  return {
    prefixAuth: function( req, res, next ) {

      // Support older POST body formats for Makes
      if ( req.body.maker && req.body.make ) {
        req.body = req.body.make;
      }

      var makerID = req.body.email,
          makeTags = req.body.tags,
          appTags = req.body.appTags,
          make = req.make;

      makeTags = typeof makeTags === "string" ? [makeTags] : makeTags;
      appTags = typeof appTags === "string" ? [appTags] : appTags;

      loginApi.isAdmin( makerID, function( err, isAdmin ) {
        if ( !lazyCheck && err ) {
          return hawkModule.respond( 500, res, req.credentials, req.artifacts, { status: failure, reason: err }, "application/json" );
        }

        var options = {
              maker: makerID,
              isAdmin: isAdmin
            },
            validTags = [];

        if ( makeTags ) {
           validTags = tags.validateTags( makeTags, options );
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
      });
    },
    adminAuth: function( req, res, next ) {
      var email = req.session ? req.session.email : "";
      if ( email ) {
        loginApi.isAdmin( email, function( err, isAdmin ) {
          if ( err || !isAdmin ) {
            return res.redirect( 302, "/login" );
          }
          next();
        });
      } else {
        res.redirect( 302, "/login" );
      }
    },
    hawkAuth: function( req, res, next ) {
      hawkModule.Hawk.server.authenticate( req, function ( publickey, callback ) {

        var credentials = {
          algorithm: 'sha256',
          user: publickey
        };

        ApiUser.findOne({ publickey: publickey }, function( err, doc ) {
          if ( err || !doc ) {
            return callback( err );
          }
          if ( doc.revoked ) {
            // only warn of revoked key if the passed MAC is successfully authenticated
            // see the hawk callback below
            req.revokedKey = true;
          }
          credentials.key = doc.privatekey;
          callback( null, credentials );
        });
      }, {}, function( err, creds, artifacts ) {
        var msg;
        if ( err || req.revokedKey ) {
          msg = err ? err.message : "Your Key has been revoked, contact a MakeAPI administrator.";
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
    crossOrigin: function( req, res, next ) {
      res.header( "Access-Control-Allow-Origin", "*" );
      next();
    },
    errorHandler: function(err, req, res, next) {
      if (!err.status) {
        err.status = 500;
      }

      res.status(err.status);
      res.json(err);
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
