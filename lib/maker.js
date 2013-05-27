var loginAPI = require( "webmaker-loginapi");

module.exports = function() {
  var env = new require( "habitat" )(),
      api = loginAPI( env.get( "LOGIN_SERVER_URL_WITH_AUTH" ) );

  return {
    isAdmin: api.isAdmin,
    getUser: api.getUser
  };
};
