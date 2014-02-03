/* This script will migrate all ApiUser records into ApiApp records
 *
 * run this script from the root of the project like so:
 * node migrations/20140206-apiApp <existingContact>::<domain> <existingContact>::<domain> ...
 */

var habitat = require( "habitat" ),
    async = require( "async" ),
    validate = require( "mongoose-validator" ).validate,
    slicedArgs = process.argv.slice( 2 ),
    mongoStreamEnded = false,
    env,
    mongoose;

var domainMap = {};

slicedArgs.forEach(function( arg ) {
  arg = arg.split( '::' );
  domainMap[ arg[0] ] = arg[1];
});

function getApiUser( mongoose ) {
  return mongoose.model( "ApiUser" , new mongoose.Schema({
    privatekey: {
      type: String,
      required: true,
      unique: true
    },
    publickey: {
      type: String,
      required: true,
      unique: true
    },
    revoked: {
      type: Boolean,
      required: true,
      "default": false
    },
    contact: {
      type: String,
      required: true,
      validate: validate( "isEmail" )
    },
    admin: {
      type: Boolean,
      required: true,
      "default": false
    }
  }));
}

habitat.load();
env = new habitat();

dbh = require( "../lib/mongoose" )( env, function( err ) {
  if ( err ) {
    console.log( err );
    process.exit( 1 );
  }

  var ApiApp = require( "../lib/models/apiApp" )( env, dbh.mongoInstance() ),
      ApiUser = getApiUser( dbh.mongoInstance() ),
      stream = ApiUser.find().stream(),
      queue = async.queue(function( doc, done ) {

        var app = new ApiApp({
          contact: doc.contact,
          privatekey: doc.privatekey,
          publickey: doc.publickey,
          domain: domainMap[ doc.contact ],
          revoked: doc.revoked,
          admin: doc.admin
        });

        app.save(function( err ) {
          if ( err ) {
            console.log( "Failure saving document:" );
            console.log( app );
            console.log( err );
            process.exit( 1 );
          }
          done();
        });
      }, 4 );// concurrency of 4

  queue.drain = function() {
    if ( mongoStreamEnded ) {
      console.log( "completed!" );
      process.exit( 0 );
    }
  };

  stream.on( "data", function onData( doc ) {
    queue.push( doc );
  }).on( "error", function( err ) {
    console.log( err );
    process.exit( 1 );
  }).on( "end", function() {
    mongoStreamEnded = true;
  });
});
