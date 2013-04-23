/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( mongoInstance ) {

  var mongoosastic = require( "mongoosastic" ),
      validate = require( "mongoose-validator" ).validate,
      env = new require( "habitat" ),
      mongoose = mongoInstance;

  var Timestamp = {
    type: Number,
    default: ( new Date() ).getTime(),
    es_type: "long",
    es_indexed: true
  };

  // Schema
  var schema = new mongoose.Schema({
    url: {
      type: String,
      required: true,
      es_indexed: true,
      validate: validate( "isUrl" ),
      unique: true,
      es_index: "not_analyzed"
    },
    contentType: {
      type: String,
      es_indexed: true,
      required: true
    },
    locale: {
      type: String,
      default: "en_us",
      es_indexed: true,
    },
    title: {
      type: String,
      es_indexed: true,
      required: true
    },
    description: {
      type: String,
      es_indexed: true
    },
    thumbnail: {
      type: String,
      es_indexed: true,
      required: true,
      validate: validate( "isUrl" )
    },
    author: {
      type: String,
      required: false,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    email: {
      type: String,
      required: true,
      validate: validate( "isEmail" ),
      es_indexed: true,
      es_index: "not_analyzed",
      select: false
    },
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
    remixedFrom: {
      type: mongoose.Schema.ObjectId,
      validate: function( n ) {
        if ( n ) {
          return mongoose.Schema.ObjectId.isValid( n );
        } else {
          return true;
        }
      }
    },
    createdAt: Timestamp,
    updatedAt: Timestamp,
    deletedAt: {
      type: Number,
      default: null,
      es_indexed: true,
      es_type: "long"
    }
  });

  // Hooks
  schema.pre( "save", function ( next ) {
    this.updatedAt = ( new Date() ).getTime();
    next();
  });

  schema.plugin( mongoosastic, {
    port: env.get( "elastic_search_port" ) || 9200,
    host: env.get( "elastic_search_host" ) || "localhost",
    hydrate: true
  });

  var Make = mongoose.model( "Make", schema );

  Make.createMapping(function( err, mapping ) {
    if ( err ) {
      console.log( "failed to create mapping", err.toString() );
    }
  });

  Make.publicFields = [ "url", "contentType", "locale", "locales",
                        "title", "description", "author",
                        "published", "tags", "thumbnail", "email" ];

  return Make;
};
