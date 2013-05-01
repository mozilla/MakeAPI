module.exports = function() {
  var env = new require( "habitat" )(),
      loginServerURL = env.get( "LOGIN_SERVER_URL" ),
      loginServerAuth = env.get( "LOGIN_SERVER_AUTH" ),
      request = require( "request" );

  return {
    isAdmin: function( user, callback ){
      request.get( loginServerURL + "/?id=" + user, {
        json: true,
        auth: {
          user: loginServerAuth.user,
          pass: loginServerAuth.pass,
          sendImmediately: true
        }
      }, function( error, resp, body ) {
        if ( error ) {
          return callback( error );
        }
        callback( null, body.isAdmin );
      });
    }
  };
};
