/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (mongoInstance) {
  var mongoosastic = require("mongoosastic"),
    mongooseValidator = require("mongoose-validator"),
    env = require("../environment"),
    validate = mongooseValidator.validate,
    url = require("url"),
    Mongoose = mongoInstance,
    elasticSearchURL = env.get("FOUNDELASTICSEARCH_URL") ||
    env.get("BONSAI_URL") ||
    env.get("ELASTIC_SEARCH_URL");

  elasticSearchURL = url.parse(elasticSearchURL);

  // This is a copy of https://github.com/chriso/node-validator/blob/master/lib/validators.js#L29-L32 which
  // is used for "isUrl" with mongoose-validator. Modified to accept underscores in the hostname.
  var urlregex = new RegExp("^(?!mailto:)(?:(?:https?|ftp):\\/\\/)?(?:\\S+(?::\\S*)" +
    "?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[" +
    "0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\_\\u00a1-" +
    "\\uffff0-9]+-?)*[a-z\\_\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*" +
    "[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d" +
    "{2,5})?(?:\\/[^\\s]*)?(?:\\?\\S*)?$", "i"
  );

  mongooseValidator.extend("isURL", function () {
    var str = this.str;
    return str.length < 2083 && str.match(urlregex);
  });

  var Timestamp = {
      type: Number,
      es_type: "long",
      es_indexed: true,
      es_index: "not_analyzed"
    },

    reportSchema = new Mongoose.Schema({
      userId: Number
    }),

    likeSchema = new Mongoose.Schema({
      userId: Number
    });

  // Schema
  var schema = new Mongoose.Schema({
    url: {
      type: String,
      required: true,
      es_indexed: true,
      validate: validate("isURL"),
      unique: true,
      es_index: "not_analyzed"
    },
    contenturl: {
      type: String,
      es_indexed: true,
      validate: validate("isURL"),
      unique: true
    },
    contentType: {
      type: String,
      es_indexed: true,
      required: true,
      es_index: "not_analyzed"
    },
    locale: {
      type: String,
      "default": "en_US",
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
      validate: validate("isEmail"),
      es_indexed: true,
      es_index: "not_analyzed"
    },
    published: {
      type: Boolean,
      "default": true,
      es_indexed: true
    },
    tags: {
      type: [String],
      es_indexed: true,
      es_index: "not_analyzed",
      es_type: "String"
    },
    reports: {
      type: [reportSchema],
      es_indexed: true
    },
    remixedFrom: {
      type: String,
      "default": null,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    remixurl: {
      type: String,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    editurl: {
      type: String,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    likes: {
      type: [likeSchema],
      es_indexed: true
    },
    ownerApp: {
      type: String,
      required: true,
      es_indexed: false
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

  schema.set("toJSON", {
    virtuals: true
  });
  schema.set("toObject", {
    virtuals: false,
    getters: false
  });

  schema.virtual("id").get(function () {
    return this._id;
  });

  schema.virtual("appTags").get(function () {
    return this.tags.filter(function (tag) {
      return (/(^[^@]+)\:[^:]+/).test(tag);
    });
  });

  schema.plugin(mongoosastic, {
    port: elasticSearchURL.port || 80,
    host: (elasticSearchURL.auth ? elasticSearchURL.auth + "@" : "") + elasticSearchURL.hostname
  });

  var Make = Mongoose.model("Make", schema);

  Make.createMapping(function (err, mapping) {
    if (err) {
      console.log("Failed to create mapping. Is ElasticSearch Running?\n", err.toString());
    }
  });

  Make.publicFields = ["url", "contentType", "contenturl", "locale",
    "title", "description", "author", "published",
    "tags", "thumbnail", "remixedFrom", "likes",
    "reports", "remixurl", "editurl"
  ];

  return Make;
};
