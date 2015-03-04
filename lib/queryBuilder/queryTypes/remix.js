/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Remix Count Query Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to count remixes of Makes
 * For documentation, see: https://github.com/mozilla/makeapi-client/blob/master/README.md
 */

var generators = require("../generators");

// DSL generator function - accepts an object that defines a query
// and a callback to pass the generated DSL to
module.exports = function (id, from, to, callback) {
  var searchQuery = generators.queries.advancedQuery();

  // don't want any make data, just a total count
  searchQuery.size = 0;
  searchQuery.query.filtered.filter.bool.must.push(generators.search.filters.remixedFrom(id));
  searchQuery.query.filtered.filter.bool.must.push(generators.remix(from, to));

  return callback(null, searchQuery);
};
