/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( environment, mongoInstance ) {

  var mongoosastic = require( "mongoosastic" ),
      validate = require( "mongoose-validator" ).validate,
      deferred = require( "deferred" ),
      env = environment,
      url = require( "url" ),
      mongoose = mongoInstance,
      elasticSearchURL = env.get( "FOUNDELASTICSEARCH_URL" ) ||
                         env.get( "BONSAI_URL" ) ||
                         env.get( "ELASTIC_SEARCH_URL" );

      elasticSearchURL = url.parse( elasticSearchURL );

  var Timestamp = {
    type: Number,
    es_type: "long",
    es_indexed: true,
    es_index: "not_analyzed"
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
      required: true,
      es_index: "not_analyzed"
    },
    locale: {
      type: String,
      "default": "en_us",
      es_indexed: true,
      es_index: "not_analyzed"
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
      es_index: "not_analyzed"
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
      es_index: "not_analyzed"
    },
    published: {
      type: Boolean,
      "default": true,
      es_index: "not_analyzed"
    },
    tags: {
      type: [ String ],
      es_indexed: true,
      es_index: "not_analyzed",
      es_type: "String"
    },
    remixedFrom: {
      type: String,
      "default": null,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    createdAt: Timestamp,
    updatedAt: Timestamp,
    deletedAt: {
      type: Number,
      "default": null,
      es_indexed: true,
      es_type: "long"
    }
  });

  schema.set( "toJSON", { virtuals: true } );

  schema.virtual( "id" ).get(function() {
    return this._id;
  });

  // Hooks
  schema.pre( "save", function ( next ) {
    this.updatedAt = Date.now();
    next();
  });

  schema.plugin( mongoosastic, {
    port: elasticSearchURL.port || 80,
    host: ( elasticSearchURL.auth ? elasticSearchURL.auth + "@" : "" ) + elasticSearchURL.hostname,
    hydrate: true
  });

  var Make = mongoose.model( "Make", schema );

  Make.createMapping(function( err, mapping ) {
    if ( err ) {
      console.log( "failed to create mapping", err.toString() );
    }
  });

  Make.publicFields = [ "url", "contentType", "locale",
                        "title", "description", "author", "published", "tags",
                        "thumbnail", "remixedFrom" ];
                        
  return Make;
};
