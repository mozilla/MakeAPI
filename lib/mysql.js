/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var mysql = require("mysql");

var dbUrl = require('url').parse(process.env.DATABASE_URL);
var auth = (dbUrl.auth || '').split(":", 2);


function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('Re-connecting lost connection: ' + err.stack);

    connection = mysql.createConnection(connection.config);
    handleDisconnect(connection);
    connection.connect();
  });
}

module.exports.createConnection = function(){

  if (dbUrl.protocol.split(':', 2)[0] != 'mysql'){
    throw {message: "DATABASE_URL specifies a non mysql database."};
  }

  var options = {
    host: dbUrl.hostname,
    database: dbUrl.pathname.split("\/", 2)[1]
  }

  if (auth.length > 0){
    options.user = auth[0]
    options.password = auth[1]
  }

  var connection = mysql.createConnection(options);
  handleDisconnect(connection);
  return connection;
}
