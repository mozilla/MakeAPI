/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Autocomplete Query Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to get a list of autocomplete suggestions.
 */

module.exports = function( generators ) {

  // limit max results to 100
  var MAX_SIZE = 100,
      DEFAULT_SIZE = 10;

  // generateAutocompleteQuery( autocompleteTerm )
  // Accepts a string to use as the facet term.
  // returns an object representing the auto complete query or
  // null if the autocompleteTerm is undefined or not a string.
  return function generateAutocompleteQuery( autocompleteTerm, size ) {
    if ( !autocompleteTerm || typeof autocompleteTerm !== "string" ) {
      return null;
    }

    size = +size;

    if ( !size || size < 1 ) {
      size = DEFAULT_SIZE;
    } else if ( size > MAX_SIZE ) {
      size = MAX_SIZE;
    }

    return {
      "query": {
        "match_all": {}
      },
      "facets": generators.facets.autocompleteTagFacet( autocompleteTerm, size ),
      "size": 0
    };
  };
};
