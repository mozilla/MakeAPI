/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
models = require('./../../../models');
Make   = models.Make;

exports.find = function(req, resp){
  //TODO: enable filtering based on query params.

  Make.findAll().success(function(makes){
    console.log(JSON.stringify(makes));
    resp.writeHead(200, {'Content-Type': 'application/json'});
    resp.write(JSON.stringify(makes));
    resp.end();
  });
};

exports.findById = function(req, resp){
  // var make = Make.find(
};

exports.create = function(req, resp){
  
};

exports.update = function(req, resp){
  
};

exports.delete = function(req, resp){
  
};
