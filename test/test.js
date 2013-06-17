var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    MakeAPI = require( '../public/js/make-api.js' ),
    now = Date.now(),
    child,
    loginChild,
    port = 3000,
    hostAuth = 'http://travis:travis@localhost:' + port,
    hostNoAuth = 'http://localhost:' + port,
    // One admin user, one non-admin
    admin = {
      email: "admin@webfaker.org",
      username: "admin",
      fullName: "An Admin",
      isAdmin: true },
    notAdmin = {
      email: "notadmin@webfaker.org",
      username: "notadmin",
      fullName: "Not Admin",
      isAdmin: false
    };

/**
 * Server functions
 */
function startLoginServer( done ) {
  var loginPort = 3001;

  function createUser( user, callback ) {
    request({
      url: "http://localhost:" + loginPort + "/user",
      method: 'post',
      json: user
    }, function( err, res, body ) {
console.log("err", err, "body", body);
      assert.ok( !err );
      assert.equal( res.statusCode, 200 );
      callback();
    });
  }

  loginChild = fork( 'test/login.webmaker.org/app.js', [], { env: {
    PORT: loginPort,
    HOSTNAME: "http://localhost",
    MONGO_URL: "mongodb://localhost:27017/local_webmakers",
    SESSION_SECRET: "secret",
    ALLOWED_USERS: "travis:travis",
    ALLOWED_DOMAINS: "http://localhost:3000 http://localhost:3001"
  }});

  loginChild.on( "message", function( msg ) {
    if( msg === "Started" ) {
      // Create a few logins
      createUser( admin, function() {
        createUser( notAdmin, done );
      });
    }
  });
}

function startServer( done ) {
  startLoginServer( function() {
    // Spin-up the MakeAPI server as a child process
    child = fork( 'server.js', null, {} );
    child.on( 'message', function( msg ) {
      if ( msg === 'Started' ) {
        done();
      }
    });
  });
}

function stopServer( done ) {
  loginChild.kill();
  child.kill();
  done();
}

/**
 * Api functions
 */

function apiHelper( verb, uri, httpCode, data, callback, assertions ) {
  // Parameter handling
  if ( typeof( data ) === "function" ) {
    callback = data;
    data = {};
  } else {
    data = data || {};
  }
  callback = callback || function(){};
  assertions = assertions || function ( err, res, body, callback ) {
    assert.ok( !err );
    assert.equal( res.statusCode, httpCode );
    callback( err, res, body );
  };

  request({
    url: uri,
    method: verb,
    json: data,
    auth: {
      user: "travis",
      pass: "travis"
    }
  }, function( err, res, body ) {
    assertions( err, res, body, callback );
  });
}

/**
 * User functions
 */

function unique( options ) {
  options = options || {};
  var u = ( ++now ).toString( 36 ),
      user = options.user || admin,
      url = 'http://' + user.username + '.makes.org/' + u;

  return {
    maker: user.email,
    make: {
      url: url,
      locale: options.locale || "en_US",
      contentType: options.contentType || 'text/html',
      title: options.title || u,
      description: options.description || u,
      thumbnail: options.thumbnail || url + "/thumbnail.png",
      author: options.author || user.fullName,
      email: options.email || user.email,
      tags: options.tags,
      remixedFrom: options.remixedFrom
    }
  };
}

/**
 * Unit tests
 */

describe( 'POST /make (create)', function() {

  var api = hostAuth + '/api/make';

  before( function( done ) {
    startServer( done );
  });

  after( function( done ) {
    stopServer( done );
  });

  it( 'should create a new make', function( done ) {
    var m = unique();

    apiHelper( 'post', api, 200, m, function( err, res, body ) {
      // Simple test, needs to be expanded for other properties we expect
      assert.equal( body.url, m.make.url );
      done();
    });
  });


  it( 'make-api.js - id', function( done ) {
    var m = unique();

    apiHelper( 'post', api, 200, m, function( err, res, body ) {
      var make = MakeAPI({ apiURL: hostNoAuth });

      console.log("body", body);

      make.id( body.id ).then( function( err, data ) {

        console.log("data", data);

        assert.ok( !err );
        assert.ok( !!data );
        assert.equal( data[ 0 ].id, body.id );
        done();
      });
    });
  });


  it( 'make-api.js - url', function( done ) {
    var m = unique();

    apiHelper( 'post', api, 200, m, function( err, res, body ) {
      var make = MakeAPI({ apiURL: hostNoAuth });

      console.log("body", body);

      make.url( m.make.url ).then( function( err, data ) {

        console.log("data", data);

        assert.ok( !err );
        assert.ok( !!data );
        assert.equal( data[ 0 ].url, m.make.url );
        done();
      });
    });
  });

});
