/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


require('should');

var
Make = require('./../../app/models').Make,
mysql = require('./../../lib/mysql').createConnection(),
makeFixtures = require('./../fixtures/makes');

describe("Makes", function(){

  describe("instantiation", function(){
    it("instantiates a fine make", function(done){
      var make = new Make(makeFixtures.aFineMake);
      make.author.should.equal('simon@simonwex.com');
      make.url.should.equal("http://thimble.webmaker.org/p/fj6v");
      make.contentType.should.equal("text/html");
      make.locale.should.equal("en_us");
      make.title.should.equal("Soapbox - Let your voice be heard");
      make.description.should.equal("Make Your Own Rant Page");
      make.published.should.be.true;
      done();
    });
  });

  describe("#create()", function(){
    after(function(){
      mysql.query("DELETE FROM makes", function(err, result){
        console.log(err);
      });
      // mysql.end();
    });

    it("creates a fine make", function(done){
      var make = Make.create(makeFixtures.aFineMake, function(make){
        make.author.should.equal('simon@simonwex.com');
        make.url.should.equal("http://thimble.webmaker.org/p/fj6v");
        make.contentType.should.equal("text/html");
        make.locale.should.equal("en_us");
        make.title.should.equal("Soapbox - Let your voice be heard");
        make.description.should.equal("Make Your Own Rant Page");
        make.published.should.be.true;
        done();
      });
    });  
  });

  describe("#find", function(done){
    var make = Make.create(makeFixtures.aFineMake, function(make){
      var id = make.id;

      Make.find(make.id, function(foundMake){
        console.log(foundMake.id);
      });
    });
  });
});
