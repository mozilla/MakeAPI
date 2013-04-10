/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
models = require('./../../../models');
logger = require('./../../../../lib/logger');
Make   = models.Make;

function handleError(resp, err, code){
  if (code >= 500){
    logger.error(err);
  }
  resp.writeHead(code, {'Content-Type': 'application/json'});
  resp.write(JSON.stringify(err));
  return resp.end();
}

function handleSave(resp, err, make){
  if (err){
    return handleError(resp, err, 400);
  }
  else{
    return resp.send(make);
  }
}

exports.find = function(req, resp){
  //TODO: enable filtering based on query params.

  return Make.find().where('deletedAt', null).exec(function(err, makes){
    if (err){
      return handleError(resp, err, 500);
    }
    else{
      // resp.writeHead(200, {'Content-Type': 'application/json'});
      return resp.send(makes);
    }
  });
};

exports.findById = function(req, resp){
  return Make.findById(req.params.id).where('deletedAt', null).exec(function(err, make) {
    if (err){
      if (err.name === 'CastError'){
        err.message = "The supplied value does not look like a Make ID.";
        return handleError(resp, err, 400);
      }
      else{
        return handleError(resp, err, 500);
      }
    }
    else{
      return resp.send(make);
    }
  });
};

exports.findByEmail = function(req, resp){
  Make.search({
    query:{
      match: {
        author: req.params.email
      }
    }
  }, function( err, makes ) {
    if ( err ) {
      console.log( err.name );
      return handleError( resp, err, 500 );
    }
    else{
      return resp.send( makes );
    }
  })
};

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
  Make.findById(req.params.id).where('deletedAt', null).exec(function(err, make){
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
  return Make.findById(req.params.id).where('deletedAt', null).exec(function(err, make) {
    if (err){
      if (err.name === 'CastError'){
        err.message = "The supplied value does not look like a Make ID.";
        return handleError(resp, err, 400);
      }
      else{
        return handleError(resp, err, 500);
      }
    }

    if (make){
      make.deletedAt = (new Date()).getTime();
      make.save(function(err, make){
        if (err){
          return handleError(resp, err, 500);
        }
      });
    }
    return resp.send(make);
  });
};
