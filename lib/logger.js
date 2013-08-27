// Borrowed from https://github.com/mozilla/openbadges

var bunyan = require( "bunyan" ),
    util = require( "util" ),

log = bunyan.createLogger({
  name: "makeapi",
  stream: process.stdout,
  level: "info",
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res
  }
});

// Borrowed from https://github.com/mozilla/openbadges
module.exports.logRequests = function( req, res, next ) {
  var startTime = new Date();
  log.info({
    req: req
  }, util.format(
    "Incoming Request: %s %s",
    req.method, req.url )
  );

  // this method of hijacking res.end is inspired by connect.logger()
  // see connect/lib/middleware/logger.js for details
  var end = res.end;
  res.end = function( chunk, encoding ) {
    var responseTime = new Date() - startTime;
    res.end = end;
    res.end( chunk, encoding );
    log.info({
      url: req.url,
      responseTime: responseTime,
      res: res,
    }, util.format(
      "Outgoing Response: HTTP %s %s (%s ms)",
      res.statusCode, req.url, responseTime )
    );
  };
  return next();
};

console.log = function() {
  process.stderr.write( util.format.apply( this, arguments ) + "\n" );
};
console.dir = function( object ) {
  process.stderr.write( util.inspect( object ) + "\n" );
};

process.once( "uncaughtException", function( err ) {
  log.fatal( err );
  throw err;
});
