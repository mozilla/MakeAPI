var loginAPI = require( "webmaker-loginapi");

module.exports = function() {
  var env = new require( "habitat" )(),
      isAdmin = loginAPI( env.get( "LOGIN_SERVER_URL_WITH_AUTH" ) ).isAdmin;

  return {
    isAdmin: isAdmin
  };
};
