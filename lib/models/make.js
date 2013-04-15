/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var
mongoose = require( "../mongoose" ),
mongoosastic = require( "mongoosastic" ),
Validators = require( "./validators" ),
validate = require( "mongoose-validator" ).validate;

var Timestamp = {
  type: Number,
  default: ( new Date() ).getTime(),
  es_type: "Integer"
};
var Email = {
  type: String,
  required: true,
  validate: validate( "isEmail" ),
  es_indexed: true,
  es_index: "not_analyzed"
}
// Schema
var schema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: validate( "isUrl" )
  },
  contentType: {
    type: String,
    required: true,
    validate: [ validate( "isIn", [ "text/html", "application/butter" ] ) ]
  },
  body: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    validate: validate( "isIn", [ "Beginner", "Intermediate", "Advanced" ] )
  },
  locale: {
    type: String,
    required: true,
    default: "en_us"
  },
  title: {
    type: String,
    required: true,
  },
  author: Email,
  published: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [ String ],
    es_indexed: true,
    es_index: "not_analyzed",
    es_type: "String"
  },
  privateTags: [ String ],
  topics: [ String ],
  remixedFrom: {
    type: mongoose.Schema.ObjectId,
    validate: Validators.isObjectIdOrNull
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: {
    type: Number,
    default: null,
    es_type: "Integer"
  }
});

// Hooks
schema.pre( "save", function ( next ) {
  this.updatedAt = ( new Date() ).getTime();
  next();
});

schema.plugin( mongoosastic, {
  hydrate: true
});

var Make = mongoose.model( "Make", schema );

Make.createMapping(function( err, mapping ) {
  if ( err ) {
    console.log( "failed to create mapping", err.toString() );
  } else {
    console.log( "mapping created", mapping );
  }
});

Make.publicFields = [ "url", "contentType", "locale", "title", "body", "difficulty", "author", "published", "tags" ];

module.exports = Make;
