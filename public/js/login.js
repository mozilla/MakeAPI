/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(function() {
  var submit = $("#submit"),
      identity = $("meta[title=persona-email]").attr( "content" ) || null;

  submit.click(function() {
    navigator.idSSO.request();
  });

  navigator.idSSO.watch({
    onlogin: function( assertion ) {
      var request = new XMLHttpRequest();

      request.open( "POST", "/persona/verify", true );
      request.setRequestHeader( "Content-Type", "application/json" );
      request.addEventListener( "loadend", function() {
        try {
          var data = JSON.parse( this.response );
          if ( data.status === "okay" ) {
            window.location.replace( "./admin" );
          } else {
            console.log( "Login failed because " + data.reason);
          }
        } catch (ex) {
          // oh no, we didn't get valid JSON from the server
        }
      }, false);
      request.send(JSON.stringify({
        assertion: assertion
      }));
    },
    onmatch: function() {
      if ( identity ) {
        window.location.replace( "./admin" );
      }
    },
    loggedInUser: identity,
    onlogout: function() {}
  });
});
