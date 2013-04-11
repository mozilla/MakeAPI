use strict;

(function(global){
  var Make = (function() {

    return {};
  })();

  // support for requireJS
  if ( typeof define === "function" && define.amd ) {
    define(function() {
      return Make;
    });
  } else {
    global.Make = Make;
  }
})(this);