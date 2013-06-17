var assert = require( 'assert' ),
    fork = require( 'child_process' ).fork,
    request = require( 'request' ),
    Webfaker = require( 'webfaker' ),
    MakeAPI = require( '../public/js/make-api.js' ),
    now = Date.now(),
    child,
    port = 3000,
    hostAuth = 'http://travis:travis@localhost:' + port,
    hostNoAuth = 'http://localhost:' + port,
    // One admin user, one non-admin
    admin = {
      email: "admin@webfaker.org",
      subdomain: "admin",
      fullName: "An Admin",
      isAdmin: true },
    notAdmin = {
      email: "notadmin@webfaker.org",
      subdomain: "notadmin",
      fullName: "Not Admin",
      isAdmin: false
    };

/**
 * Server functions
 */
function startServer( done ) {
  Webfaker.start({
    port: port + 1,
    username: "travis",
    password: "travis",
    fakes: 10,
    logins: [ admin, notAdmin ],
    isAdminCheck: true
  }, function() {
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
  Webfaker.stop( function() {
    child.kill();
    done();
  });
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
    json: data
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
      user = options.user || admin;

  return {
    maker: user.email,
    make: {
      url: 'http://' + user.subdomain + '.makes.org/' + u,
      locale: options.locale || "en_US",
      contentType: options.contentType || 'text/html',
      title: options.title || u,
      description: options.description || u,
      thumbnail: options.thumbnail || this.url + "/thumbnail.png",
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


  it( 'make-api.js - url', function( done ) {
    var m = unique();

    apiHelper( 'post', api, 200, m, function( err, res, body ) {
      var make = MakeAPI({ apiURL: hostNoAuth });

      console.log("body", body);

      make.url( m.url ).then( function( err, data ) {

        console.log("data", data);

        assert.ok( !err );
        assert.ok( !!data );
        assert.equal( data[ 0 ].url, m.url );
        done();
      });
    });
  });

});
