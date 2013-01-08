/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
models = require('./../../../models');
Make   = models.Make;

exports.find = function(req, resp){
  //TODO: enable filtering based on query params.

  return Make.find(function(err, makes){
    if (err){
      return console.log(err);
    }
    else{
      // resp.writeHead(200, {'Content-Type': 'application/json'});
      return resp.send(makes);
    }
  });
};

exports.findById = function(req, resp){
  return Make.findById(req.params.id, function(err, make) {
    if (!err){
      return resp.send(make);
    }
    else{
      return console.log(err);
    }
  });
};

function handleSave(resp, err, make){
  if (err){
    resp.writeHead(400, {'Content-Type': 'application/json'});
    resp.write(JSON.stringify(err));
    return resp.end();
  }
  else{
    return resp.send(make);
  }
}

exports.create = function(req, resp){
  var make = new Make();

  for (var i in Make.publicFields){
    var field = Make.publicFields[i];
    make[field] = req.body[field];
  }

  make.save(function(err, make){
    return handleSave(resp, err, make);
  });
};

exports.update = function(req, resp){
  Make.findById(req.params.id, function(err, make){
    for (var i in Make.publicFields){
      var field = Make.publicFields[i];
      if (req.body.indexOf(field)){
        make[field] = req.body[field];
      }
    }
    make.save(function(err, make){
      return handleSave(resp, err, make);
    });
  });
};

exports.delete = function(req, resp){
  // TODO: set deletedAt and add to all queries.
};
