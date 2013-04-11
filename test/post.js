var querystring = require('querystring'),
    http = require('http'),
    fs = require('fs'),
    fakeIt = require('./fake'),

    postData, postOptions, postReq,

    numberOfRecords = 1000;

for ( var i = 0; i < numberOfRecords; i++ ) {

  var postData = querystring.stringify( fakeIt() );

  postOptions = {
    host: 'localhost',
    port: '5000',
    path: '/api/make',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  postReq = http.request( postOptions, function ( res ) {
    res.setEncoding( 'utf8' );
    res.on( 'data', function ( chunk ) {
      console.log( 'Response: ' + chunk + '\n' );
    });
  });

  postReq.write( postData );
  postReq.end();
}