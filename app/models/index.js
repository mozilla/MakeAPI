/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var 
Sequelize = require('sequelize'),
sequelize = require('../../lib/sequelize'),
make      = require('./make'),
image     = require('./image'),
tag       = require('./tag'); 

var Make = sequelize.define('Make', make.schema, {
  paranoid: true,
  classMethods: make.classMethods,
  instanceMethods: make.instanceMethods
});

var Tag = sequelize.define('Tag', tag.schema, {
  paranoid: true,
  classMethods: tag.classMethods,
  instanceMethods: tag.instanceMethods
});

var Image = sequelize.define('Image', image.schema, {
  paranoid: true,
  classMethods: image.classMethods,
  instanceMethods: tag.instanceMethods
});

Make
  .hasMany(Tag, {as: 'Tags'})
  .hasMany(Tag, {as: 'PrivateTags'})
  .hasOne(Image, {as: 'Thumbnail'});

module.exports.Make  = Make;
module.exports.Tag   = Tag;
module.exports.Image = Image;



//TODO: indexes: author, contentAuthor, contentType, 
