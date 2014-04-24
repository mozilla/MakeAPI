/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * User's Likes Search Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to fetch a users liked makes
 * For documentation, see: https://github.com/mozilla/makeapi-client/blob/master/README.md
 */

var generators = require( "../generators" );

// limit max results to 100
var MAX_SIZE = 100,
    DEFAULT_SIZE = 10;

module.exports = function getUserLikes( id, size ) {
  var searchQuery = generators.queries.baseQuery();

   size = +size;

  if ( !size || size < 1 ) {
    size = DEFAULT_SIZE;
  } else if ( size > MAX_SIZE ) {
    size = MAX_SIZE;
  }

  searchQuery.size = size;
  searchQuery.query.filtered.filter.bool.must.push( generators.likes( id ) );

  return searchQuery;
};
