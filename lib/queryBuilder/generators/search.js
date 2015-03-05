/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This module generates Elastic Search query DSL filters for search queries
 * See: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filters.html
 */

var generic = require("./generic");

/*
 * The properties of this exported object map to properties on the make object model,
 * and return a filter to be added to the ES query.
 */
module.exports.filters = {
  author: function (name, not) {
    return generic.generateSearchFilter("term", {
      author: name
    }, not);
  },

  contentType: function (contentType, not) {
    return generic.generateSearchFilter("term", {
      contentType: contentType
    }, not);
  },

  description: function (description, not) {
    return generic.generateSearchFilter("query", {
      match: {
        description: {
          query: description,
          operator: "and"
        }
      }
    }, not);
  },

  id: function (ids, not) {
    // It's safe to try and split on ',' because it cannot be a character in an id
    ids = ids.split(",");

    if (ids.length === 1) {
      return generic.generateSearchFilter("term", {
        _id: ids[0]
      }, not);
    } else {
      return generic.generateTermsFilter(ids, "_id", not);
    }
  },

  remixedFrom: function (id, not) {
    return generic.generateSearchFilter("term", {
      remixedFrom: id
    }, not);
  },

  tags: function (tags, not) {
    return generic.generateTermsFilter(tags.split(","), "tags", not);
  },

  tagPrefix: function (prefix, not) {
    return generic.generateSearchFilter("prefix", {
      tags: prefix
    }, not);
  },

  title: function (title, not) {
    return generic.generateSearchFilter("query", {
      match: {
        title: {
          query: title,
          operator: "and"
        }
      }
    }, not);
  },

  url: function (url, not) {
    return generic.generateSearchFilter("term", {
      url: url
    }, not);
  },

  remixCount: function (options, not) {
    return generic.generateSearchFilter("range", {
      createdAt: {
        gte: options.from,
        lte: options.to
      }
    }, not);
  }
};

// Export the keys of the filters object to help consumers determine if a filter is defined for a field
module.exports.KEYS = Object.keys(module.exports.filters);
