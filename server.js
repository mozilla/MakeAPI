/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// New Relic Server monitoring support
if ( process.env.NEW_RELIC_ENABLED ) {
  require( "newrelic" );
}

// Bring in all your require modules
var express = require( "express" ),
    helmet = require( "helmet" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" ),
    WebmakerAuth = require( "webmaker-auth" );

// Generate app variables
var app = express(),
    env = require( "./lib/environment" ),
    Mongo = require( "./lib/mongoose" )(),
    Make = require( "./lib/models/make" )( Mongo.mongoInstance() ),
    apiApp = require( "./lib/models/apiApp" )( Mongo.mongoInstance() ),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname + "/views" ) ), { autoescape: true } ),
    csrfMiddleware = express.csrf(),
    webmakerAuth = new WebmakerAuth({
      loginURL: env.get( "LOGIN_SERVER_URL_WITH_AUTH" ),
      secretKey: env.get( "SESSION_SECRET" ),
      forceSSL: env.get( "FORCE_SSL" ),
      domain: env.get( "COOKIE_DOMAIN" )
    }),
    lessMiddleware = require( "less-middleware" ),
    messina,
    logger;

// Enable template rendering with nunjucks
nunjucksEnv.express( app );
// Don't send the "X-Powered-By: Express" header
app.disable( "x-powered-by" );

if ( env.get( "ENABLE_GELF_LOGS" ) ) {
  messina = require( "messina" );
  logger = messina( "Make-API-" + env.get( "NODE_ENV" ) || "development" );
  logger.init();
  app.use( logger.middleware() );
} else {
  app.use( express.logger( "dev" ) );
}

app.use(express.favicon("public/images/favicon.ico", {
  maxAge: 31556952000
}));

app.use( helmet.iexss() );
app.use( helmet.contentTypeOptions() );
app.use( helmet.xframe() );

if ( !!env.get( "FORCE_SSL" ) ) {
  app.use( helmet.hsts() );
  app.enable( "trust proxy" );
}
app.use( express.compress() );
app.use( express.static( path.join( __dirname + "/public" ) ) );
app.use( express.json() );
app.use( express.urlencoded() );
app.use( webmakerAuth.cookieParser() );
app.use( webmakerAuth.cookieSession() );

var optimize = env.get( "NODE_ENV" ) !== "development",
  tmpDir = path.join( require("os").tmpDir(), "makeapi.webmaker.org" );
app.use(lessMiddleware({
  once: optimize,
  debug: !optimize,
  dest: tmpDir,
  src: path.resolve( __dirname, "public" ),
  compress: optimize,
  yuicompress: optimize,
  optimization: optimize ? 0 : 2,
  sourceMap: !optimize
}));
app.use(express.static(tmpDir));

app.use( app.router );

var routes = require( "./routes" )( Make, apiApp ),
    middleware = require( "./lib/middleware" )( Make, apiApp );

app.use( middleware.errorHandler );
app.use( middleware.fourOhFourHandler );

function corsOptions ( req, res ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Content-Type" );
  res.send( 200 );
}

app.get( "/", routes.index );

app.options( "/api/20130724/make/search", corsOptions );

// Session Verification Route
app.post(
  "/verify",
  csrfMiddleware,
  webmakerAuth.handlers.verify
);

// Login Route
app.post(
  "/authenticate",
  csrfMiddleware,
  webmakerAuth.handlers.authenticate
);

// Logout Route
app.post(
  "/logout",
  csrfMiddleware,
  webmakerAuth.handlers.logout
);

// Create Make
app.post(
  "/api/20130724/make",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMakeCreator,
  middleware.validateAppTags,
  routes.create
);

// Update Make
app.put(
  "/api/20130724/make/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  middleware.getMakeCreator,
  middleware.validateAppTags,
  routes.update
);

// Delete Make
app.del(
  "/api/20130724/make/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  routes.remove
);

// Like Make
app.put(
  "/api/20130724/make/like/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  middleware.like,
  routes.update
);

// Unlike Make
app.put(
  "/api/20130724/make/unlike/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  middleware.unlike,
  routes.update
);

// Report Make
app.put(
  "/api/20130724/make/report/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  middleware.report,
  routes.update
);

// Cancel Make Report
app.put(
  "/api/20130724/make/cancelReport/:id",
  middleware.hawkAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  middleware.checkMakeOwner,
  middleware.cancelReport,
  routes.update
);

// Search for Makes
app.get(
  "/api/20130724/make/search",
  Mongo.isDbOnline,
  middleware.crossOrigin,
  routes.search
);

// Authenticated Make Search
app.get(
  "/api/20130724/make/protectedSearch",
  Mongo.isDbOnline,
  middleware.hawkAuth,
  routes.protectedSearch
);

// Get Make Remix Count
app.get(
  "/api/20130724/make/remixCount",
  middleware.crossOrigin,
  routes.remixCount
);

// Tag Suggestion (Autocomplete API)
app.get(
  "/api/20130724/make/tags",
  Mongo.isDbOnline,
  middleware.crossOrigin,
  routes.autocomplete
);

// Admin Make Update route
app.put(
  "/admin/api/20130724/make/:id",
  csrfMiddleware,
  middleware.collabAuth,
  middleware.fieldFilter,
  Mongo.isDbOnline,
  middleware.getMake,
  routes.update
);

// Admin Make Delete Route
app.del(
  "/admin/api/20130724/make/:id",
  csrfMiddleware,
  middleware.adminAuth,
  Mongo.isDbOnline,
  middleware.getMake,
  routes.remove
);

// Admin Search Route
app.get(
  "/admin/api/20130724/make/protectedSearch",
  csrfMiddleware,
  middleware.collabAuth,
  Mongo.isDbOnline,
  routes.protectedSearch
);

// Admin Remix Count
app.get(
  "/admin/api/20130724/make/remixCount",
  routes.remixCount
);

// Admin Log-in Page
app.get(
  "/login",
  csrfMiddleware,
  routes.login
);

// Admin Tool
app.get(
  "/admin",
  csrfMiddleware,
  middleware.collabAuth,
  routes.admin
);

// Admin tool path for generating Hawk Keys
app.post(
  "/admin/api/app",
  csrfMiddleware,
  middleware.adminAuth,
  Mongo.isDbOnline,
  routes.addApp
);

// Serve makeapi-client.js over http
app.get( "/js/make-api.js", function( req, res ) {
  res.sendfile( path.resolve( __dirname, "node_modules/makeapi-client/src/make-api.js" ) );
});

app.get( "/healthcheck", routes.healthcheck );

app.listen( env.get( "PORT", 3000 ), function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:%d )", env.get( "PORT", 3000 ));
});
