/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Facet Genenerators
 * This module generates facets for ElasticSearch Queries
 */

module.exports = {
  // Returns autocomplete suggestions by running a terms facet on a query.
  autocompleteTagFacet: function( term, size ) {
    return {
      "tags": {
        "terms": {
          "field": "tags",
          "regex": "^" + term + "[^:]*$",
          "size": size
        }
      }
    };
  }
};
