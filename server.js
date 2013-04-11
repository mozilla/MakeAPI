// Bring in all your require modules
var express = require( "express" ),
    habitat = require( "habitat" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" ),
    redisUrl = require( "redis-url" ),
    connect = require( "connect" ),
    RedisStore = require( "connect-redis" )( connect );

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    env = new habitat(),
    middleware = require( "./lib/middleware" ),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname + "/views" ) ) );
    routes = require( "./routes" )( env );

var sessionStore = new RedisStore({
      client: redisUrl.connect(),
      maxAge: ( 30 ).days
    });

// Enable template rendering with nunjucks
nunjucksEnv.express( app );
// Don't send the "X-Powered-By: Express" header
app.disable( "x-powered-by" );

app.use( express.logger() );
app.use( express.compress() );
app.use( express.static( path.join( __dirname + "/public" ) ) );
app.use( express.bodyParser() );
app.use( express.cookieParser() );

// Express Configuration
app.configure(function(){
  
  app.use( connect.session({
    secret: env.get( "SESSION_SECRET" ),
    store: sessionStore,
    cookie: { maxAge: ( 365 ).days }
  }));

  require( "express-persona" )( app, {
    audience: env.get( "PERSONA_AUDIENCE" )
  });

});

app.get( "/", routes.index );
app.get( "/search", routes.search );
app.delete( "/api/make/:id", routes.api_remove );
app.post( "/api/make", routes.api_create );
app.put( "/api/make/:id", routes.api_update );
app.post( "/api/makes/search", routes.api_search );

app.listen( env.get( "PORT", 3000 ), function() {
  console.log( "MakeAPI server listening ( Probably http://localhost:%d )", env.get( "PORT", 3000 ));
});
