module.exports = function( env ) {

  var userList = env.get( "ALLOWED_USERS" ),
      qs = require( "querystring" );

  userList = qs.parse( userList, ",", ":" );

  return {
    authenticateUser: function( user, pass ) {
      for ( var username in userList ) {
        if ( userList.hasOwnProperty( username ) ) {
          if ( user === username && pass === userList[ username ] ) {
            return true;
          }
        }
      }
      return false;
    }
  };
};
