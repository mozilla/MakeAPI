var FakeAPI = require("./FakeAPI.js"),
    Make = require("../../public/js/make-api.js"),
    port = 5124,
    username = "username",
    password = "secret";

/**
 * Simple demo of using the FakeAPI. Start a FakeAPI server
 * on port 5124 and create 50 fake makes.
 */
FakeAPI.start({
  port: port,
  username: username,
  password: password,
  fakes: 50
}, function(){

  function make() {
    return Make({
      apiURL: "http://localhost:" + port,
      auth: username + ":" + password
    });
  }

  // Find all the makes tagged "tutorial"
  make().tags("tutorial").then( function( err, results ) {
    // Display the results we get back:
    console.log( results );

    // Get the first make in the results
    var result0 = results[ 0 ];

    // Try getting the same make by _id
    make().id( result0._id ).then( function( err, _idResults ) {
      console.log("_id results", _idResults);
    });

    // Try getting the same make by URL
    make().url( result0.url ).then( function( err, urlResults ) {
      console.log("url results", urlResults);

      var doc = urlResults[ 0 ];
      doc.url = "new url";
      doc.update();
    });
  });
});
