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
    middleware = require( "./lib/middleware" )( env ),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname + "/views" ) ) ),
    routes = require( "./routes" )( Make );

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
  secret: env.get( "SESSION_SECRET" ),
  cookie: {
    maxAge: 2678400000 // 31 days. Persona saves session data for 1 month
  },
  proxy: true
}));

app.get( "/", routes.index );
app.post( "/api/make", express.basicAuth( middleware.authenticateUser ), Mongo.isDbOnline, routes.create );
app.put( "/api/make/:id", express.basicAuth( middleware.authenticateUser ), Mongo.isDbOnline, routes.update );
app.del( "/api/make/:id", express.basicAuth( middleware.authenticateUser ), Mongo.isDbOnline, routes.remove );
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

app.listen( env.get( "PORT", 3000 ), function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:%d )", env.get( "PORT", 3000 ));
});
