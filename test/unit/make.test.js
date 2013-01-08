/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


var
Make = require('./../../app/models').Make,
should = require('should'),
makeFixtures = require('./../fixtures/makes');

var createdIds = [];

function keys(obj){
  var keys = [];

  for(var key in obj){
    if(obj.hasOwnProperty(key))
      keys.push(key);
  }
  return keys;
}

describe("Makes", function(){

  describe("#create()", function(){
    after(function(){
      
    });

    it("won't create a broken make", function(done){
      var make = new Make(makeFixtures.aReallyCrapBrokenMake);
      make.save(function(err, make){
        should.exist(err);
        var failedFields = keys(err.errors).sort();
        var brokenFields = ['author', 'body', 'difficulty', 'contentAuthor', 'contentType', 'title', 'url'].sort();
        // console.log(failedFields);
        // console.log(brokenFields);
        for(var i in failedFields){
          brokenFields[i].should.equal(failedFields[i]);
        }
      });
      done();
    });

    it("creates a fine make", function(done){
      var make = new Make(makeFixtures.aFineMake);
      make.save(function(err, make){
        should.not.exist(err);
        should.exist(make._id);
        should.exist(make.createdAt);
        should.exist(make.updatedAt);
        should.not.exist(make.deletedAt);
        make.author.should.equal('simon@simonwex.com');
        make.url.should.equal("http://thimble.webmaker.org/p/fj6v");
        make.contentType.should.equal("text/html");
        make.locale.should.equal("en_us");
        make.title.should.equal("Soapbox - Let your voice be heard");
        make.body.should.equal("<h1>Make Your Own Rant Page</h1><p>blah blah blah, this is your pulpit.</p>");
        make.published.should.be.true;

        done();
      });
    });  
  });
});
