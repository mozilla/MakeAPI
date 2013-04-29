/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var querystring = require('querystring'),
    http = require('http'),
    fs = require('fs'),
    fakeIt = require('./fake'),
    habitat = require('habitat'),

    auth = process.env.AUTH,

    postData, postOptions, postReq,

    numberOfRecords = 1000;

habitat.load();

if ( !auth ) {
  console.error( "ERROR: You need credentials to write to the database. " +
    "Specify the AUTH environment variable" );
  return;
}

for ( var i = 0; i < numberOfRecords; i++ ) {

  var postData = querystring.stringify( fakeIt() );

  postOptions = {
    auth: auth,
    host: process.env.HOST,
    port: process.env.PORT,
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