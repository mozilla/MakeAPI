/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// New Relic Server monitoring support
if ( process.env.NEW_RELIC_ENABLED ) {
  require( "newrelic" );
}

// Bring in all your require modules
var express = require( "express" ),
    habitat = require( "habitat" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" );

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    env = new habitat(),
    Mongo = require( "./lib/mongoose" )( env ),
    Make = require( "./lib/models/make" )( env, Mongo.mongoInstance() ),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname + "/views" ) ) ),
    routes,
    loginApi,
    middleware,
    authMiddleware;


// Enable template rendering with nunjucks
nunjucksEnv.express( app );
// Don't send the "X-Powered-By: Express" header
app.disable( "x-powered-by" );

app.use( express.logger( env.get( "NODE_ENV" ) === "production" ? "" : "dev" ) );
app.use( express.compress() );
app.use( express.static( path.join( __dirname + "/public" ) ) );
app.use( express.bodyParser() );
app.use( express.cookieParser() );
app.use( express.cookieSession({
  key: "makeapi.sid",
  secret: env.get( "SESSION_SECRET" ),
  cookie: {
    maxAge: 2678400000 // 31 days. Persona saves session data for 1 month
  },
  proxy: true
}));

loginApi = require( "webmaker-loginapi" )( app, env.get( "LOGIN_SERVER_URL_WITH_AUTH" ) );
routes = require( "./routes" )( Make, loginApi, env );
middleware = require( "./lib/middleware" )( loginApi, env );
authMiddleware = express.basicAuth( middleware.authenticateUser );

require( "express-persona" )( app, {
  audience: env.get( "AUDIENCE" ),
  verifyResponse: middleware.verifyPersonaLogin
});

app.get( "/", routes.index );
app.post( "/api/make", authMiddleware, Mongo.isDbOnline, middleware.prefixAuth, routes.create );
app.put( "/api/make/:id", authMiddleware, Mongo.isDbOnline, middleware.prefixAuth, routes.update );
app.del( "/api/make/:id", authMiddleware, Mongo.isDbOnline, routes.remove );
app.get( "/api/makes/search", Mongo.isDbOnline, function crossOrigin( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  next();
}, routes.search );
app.options( "/api/makes/search", function( req, res ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Content-Type" );
  res.send( 200 );
});
app.get( "/healthcheck", routes.healthcheck );

app.get( "/login", routes.login );
app.get( "/admin", middleware.adminAuth, routes.admin );
app.put( "/admin/api/make/:id", middleware.adminAuth, routes.update );
app.get( "/admin/api/makes/search", Mongo.isDbOnline, function crossOrigin( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  next();
}, routes.search );
app.options( "/admin/api/makes/search", function( req, res ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Content-Type" );
  res.send( 200 );
});

app.listen( env.get( "PORT", 3000 ), function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:%d )", env.get( "PORT", 3000 ));
});
