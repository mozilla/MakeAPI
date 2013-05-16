/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * A Fake MakeAPI server (i.e., FakeAPI). The idea is to simulate MongoDB
 * and Elastic Search, while still retaining the routes and internal logic.
 * The FakeAPI server is not as full-featured as the MakeAPI, espcially
 * when it comes to complex searches in Elastic Search. Currently, only
 * searching by ID (i.e., _id) and Tags is supported.
 *
 * This module exposes two functions, `start` and `stop`. These are used
 * to control an instance of the FakeAPI. The `start` function can optionally
 * be passed a `port` (5123 is the default), and a number of `fakes`, which
 * will cause fake documents to be generated and inserted (see counterfeit.js).
 *
 * You can see an example of how to interact with the server and use
 * make-api.js in `example.js`.
 */
var express = require( "express" ),
    habitat = require( "habitat" ),
    server,
    Fogin,
    Fake = require( "./fake.js" ),
    Make = require( "../../public/js/make-api.js" ),
    counterfeit = require( "./counterfeit.js" );

module.exports = {
  start: function( options, callback ) {
    options = options || {};
    // Default basic auth creds
    options.username = options.username || "user";
    options.password = options.password || "password";
    callback = callback || function(){};

    var port = options.port || 5123,
        foginPort = port + 1,
        foginUrl = "http://" + options.username + ":" + options.password + "@localhost:" + foginPort,
        fakes = options.fakes;

    Fogin = require( "webmaker-loginapi" )( foginUrl ).Fogin,

    // Export faked env vars expected for basic auth integration (see lib/maker.js)
    process.env.ALLOWED_USERS = options.username + ":" + options.password;
    process.env.LOGIN_SERVER_URL_WITH_AUTH = "http://" + options.username + ":" + options.password +
                                             "@localhost:" + foginPort;

    function startFakeAPI() {
      habitat.load();

      var app = express(),
          env = new habitat(),
          routes = require( "../../routes/make.js" )( Fake, env ),
          middleware = require( "../../lib/middleware.js" )( env );

      app.use( express.logger( "dev" ) );
      app.use( express.bodyParser() );

      app.post( "/api/make", express.basicAuth( middleware.authenticateUser ),
                             middleware.prefixAuth,
                             routes.create );
      app.put( "/api/make/:id", express.basicAuth( middleware.authenticateUser ),
                                middleware.prefixAuth, routes.update );
      app.del( "/api/make/:id", express.basicAuth( middleware.authenticateUser ),
                                middleware.prefixAuth, routes.remove );
      app.get( "/api/makes/search", function crossOrigin( req, res, next ) {
        res.header( "Access-Control-Allow-Origin", "*" );
        next();
      }, routes.search );
      app.options( "/api/makes/search", function( req, res ) {
        res.header( "Access-Control-Allow-Origin", "*" );
        res.header( "Access-Control-Allow-Headers", "Content-Type" );
        res.send( 200 );
      });

      server = app.listen( port, function( req, res ) {
        if ( !fakes ) {
          callback( req, res );
          return;
        }
        var make = Make({
          apiURL: "http://localhost:" + port,
          auth: options.username + ":" + options.password
        });

        function createFake() {
          var fake = counterfeit.createFake();
          make.create({
            maker: fake.email,
            make: fake
          }, function( err, make ) {
            if( !--fakes ) {
              callback( req, res );
              return;
            }
            createFake();
          });
        }
        createFake();
      });
    }

    // Spin up a fake login server too
    Fogin.start({
      port: port + 1,
      username: options.username,
      password: options.password,
      logins: counterfeit.users.map( function( email ) {
        return {
          email: email,
          fullName: counterfeit.createName(),
          // TODO: randomize this...
          isAdmin: true
        };
      })
    }, startFakeAPI );
  },

  stop: function( callback ) {
    callback = callback || function(){};
    if ( !server ) {
      return;
    }
    server.close( function() {
      server = null;
      Fogin.stop( callback );
    });
  }
};
