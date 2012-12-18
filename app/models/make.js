/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
mysql     = require('./../../lib/mysql').createConnection(),
logger    = require('./../../lib/logger'),
Validator = require("validator").Validator,
uuid      = require("node-uuid");

function Make(params){
  this._errors = [];
  this._columns = "id version url contentType locale title description author \
                   contentAuthor published createdAt updatedAt deletedAt".split(/\s+/);

  // Pluck a few special cases:
  if ("published" in params)
    this.published = !!params.published;
  else
    this.published = true;

  delete params['published'];

  // Then the rest we care about:
  if (params){
    for (var x in this._columns){
      if (params[this._columns[x]]){
        var key = this._columns[x]
        this[key] = params[key];
      }
    }
  }
}

Make.create = function(params, callback){
  var make = new Make(params);
  make.save(callback);
}

Make.find = function(id, callback){
  mysql.query("SELECT * FROM makes WHERE id = ?", [id], function(err, results){
    if (typeof(callback) === 'function'){
      if (err){
        logger.error({"Error retrieving Make": err});
      }
      console.log(results);
      callback(new Make());
    }
  });
}

Make.prototype.hasErrors = function(){
  return (this._errors.length > 0)
}

Make.prototype.validate = function(){

  this._errors.length = 0;
  var validator = new Validator();

  var t = this;
  validator.error = function(msg){
    t._errors.push(msg);
  }

  validator.check(this.url).isUrl();
  

  validator.check(this.contentType).isIn(['text/html', 'application/butter']);

  this.locale.toLowerCase();
  validator.check(this.locale).is(/.._../);


  validator.check(this.title).notNull();

  validator.check(this.description).notNull();

  if (this.author)
    validator.check(this.author).isEmail();
  else
    this.author = null;

  if (this.contentAuthor)
    validator.check(this.contentAuthor).isEmail();
  else
    this.contentAuthor = null;

  return !this.hasErrors();
}

Make.prototype.save = function(callback){
  if (this.validate()){
    var params = {};
    for (var x in this._columns){
      var key = this._columns[x];
      params[key] = this[key];
    }
    if (!this.createdAt)
      params.createdAt = new Date();
    else
      delete params['createdAt'];

    params.updatedAt = new Date();
    params.version = uuid.v1();

    if (!this.id){
      var make = this;
      params.id = uuid.v1();
      mysql.query('INSERT INTO makes SET ?', params, function(err, result){
        // TODO: error handling
        if (err)
          logger.error(err);
        // if (result.affectedRows == 1){
        make.createdAt = params.createdAt;
        make.updatedAt = params.updatedAt;
        make.version = params.version;
        make.id = params.id;
        callback(make);
      });
    }
    else{
      
    }
    
  }
  else{
    throw {name : "ValidationError", message : "Your Make did not validate", errors: this._errors}; 
  }
}

module.exports = Make;
