/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

require('./../../lib/extensions/object');

var
models = require('./../../app/models'),
uuid = require('node-uuid');
var aMake = models.Make.build({
  contentType: 'text/html',
  url: 'http://simonwex.com/',
  title: 'This be my title'
});

aMake.version = uuid.v1();
var errors = aMake.validate();

if (aMake.author == null)
  delete errors['author'];

if (aMake.contentAuthor == null)
  delete errors['contentAuthor'];


if (Object.size(errors) > 0){
  console.log("we've got an error");
  console.log(errors);
}
else {
  aMake.save();
}
