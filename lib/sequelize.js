/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var Sequelize = require("sequelize");

var dbUrl = require('url').parse(process.env.DATABASE_URL);
var auth = (dbUrl.auth || '').split(":", 2);

var options = {
  // custom host; default: localhost
  host: dbUrl.hostname,
 
  // custom port; default: 3306
  port: dbUrl.port,
 
  // disable logging; default: console.log
  logging: false,

  omitNull: true,
 
  // max concurrent database requests; default: 50
  maxConcurrentQueries: 100,
 
  // the sql dialect of the database
  // - default is 'mysql'
  // - currently supported: 'mysql', 'sqlite', 'postgres'
  dialect: dbUrl.protocol.split(':', 2)[0]
}

if (dbUrl.protocol === 'sqlite'){
  // the storage engine for sqlite
  // - default ':memory:'
  options.storage = dbUrl.path;
}

var dbname = dbUrl.pathname.split("\/", 2)[1];

module.exports = new Sequelize(dbname, auth[0], auth[1], options);
