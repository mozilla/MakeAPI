/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Search Query Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to search for makes.
 * For documentation, see: https://github.com/mozilla/makeapi-client/blob/master/README.md
 */

var DEFAULT_SEARCH_SIZE = 10,
    MAX_SEARCH_SIZE = 1000;

module.exports = function( generators ) {

  // if a field is to be negated (i.e. makes not containing the title "yolo"),
  // the field will be prefixed with the following string (no quotes): "{!}"
  var NOT_REGEX = /^\{!\}(.+)$/;

  // detect if there is a matching search generator for a given field
  function hasValidField( field ) {
    return generators.search.KEYS.indexOf( field ) !== -1;
  }

  // Validate a given size & checks if the value is in
  // the correct bounds: >= 1 <= MAX_SEARCH_SIZE
  function validateSize( size ) {
    size = size && isFinite( size ) ? size : DEFAULT_SEARCH_SIZE;
    if ( size > MAX_SEARCH_SIZE ) {
      return MAX_SEARCH_SIZE;
    } else if ( size < 1 ) {
      return 1;
    }
    return size;
  }

  // Validate that the requested page is a number and is
  // within correct bounds: page >= 0. Will also calculate
  // the correct "from" value based on requested number of results
  // see: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-from-size.html
  function validatePage( page, size ) {
    page = page && isFinite( page ) ? page : 1;
    if ( page < 1 ) {
      return 0;
    }
    return --page * size;
  }

  // DSL generator function - accepts an object that defines a query
  // and a callback to pass the generated DSL to
  return function( query, callback, authenticated ) {
    if ( !( query && query.constructor === Object ) || !( callback && typeof callback === "function" ) ) {
      throw new Error( "Check your arguments." );
    }

    query.limit = +query.limit;
    query.page = +query.page;
    var size = query.limit,
        page = query.page,
        user = query.user,
        sort = query.sortByField,
        filterOccurence = query.or ? "should" : "must",
        queryKeys = Object.keys( query ),
        searchQuery,
        sortObj,
        notRegexMatch;

    // If the request contains any of the filter generating keys, or defines a user search, use the advancedQuery object
    if ( queryKeys.some( hasValidField ) || user ) {
      if ( authenticated ) {
        searchQuery = generators.queries.authenticatedQuery();
      } else {
        searchQuery = generators.queries.advancedQuery();
      }
      queryKeys.forEach(function( key ) {
        var value = query[ key ];
        if ( generators.search.KEYS.indexOf( key ) !== -1 ) {
          notRegexMatch = NOT_REGEX.exec( value );
          if ( notRegexMatch ) {
            searchQuery.query.filtered.filter.bool[ filterOccurence ]
            .push( generators.search.filters[ key ]( notRegexMatch[ 1 ], true ) );
          } else {
            searchQuery.query.filtered.filter.bool[ filterOccurence ]
            .push( generators.search.filters[ key ]( value ) );
          }
        }
      });
    } else if ( authenticated ) {
      searchQuery = generators.queries.authenticatedQuery( true );
    } else {
      searchQuery = generators.queries.baseQuery();
    }

    searchQuery.size = validateSize( size );
    searchQuery.from = validatePage( page, searchQuery.size );

    if ( sort ) {
      sort = ( Array.isArray( sort ) ? sort : [ sort ] ).filter(function( pair ) {
        return typeof pair === "string" &&
          pair.length &&
          generators.sort.VALID_SORT_FIELDS.indexOf( pair.split( "," )[ 0 ] ) !== -1;
      });
      if ( sort.length ) {
        searchQuery.sort = [];
        sort.forEach(function( pair ) {
          pair = pair.split( "," );
          if ( [ "likes", "reports" ].indexOf( pair[ 0 ] ) !== -1 ) {
            sortObj = generators.sort.generateScriptSort( "doc['" + pair[ 0 ] + ".userId'].values.length", pair[ 1 ] );
          } else {
            sortObj = generators.sort.generateRegularSort( pair[ 0 ], pair[ 1 ] );
          }
          searchQuery.sort.push( sortObj );
        });
      }
    }

    // Due to makes being assigned emails and not usernames,
    // this must be a special separate case...
    if ( user ) {
      notRegexMatch = NOT_REGEX.exec( user );
      if ( notRegexMatch ) {
        user = notRegexMatch[ 1 ];
      }
      generators.user({
        user: user,
        isOr: !!searchQuery.query.filtered.filter.bool.should.length,
        not: !!notRegexMatch
      }, function generationComplete( err, filter ) {
        if ( err ) {
          return callback( err );
        }

        // add the returned user filter if it exists
        // it may not exist and not be erroneous if
        // the filters are running with the "or"
        // execution style.
        if ( filter ) {
          searchQuery.query.filtered.filter.bool[ filterOccurence ].push( filter );
        }

        // pass the generated DSL to the callback
        return callback( null, searchQuery );
      });
    } else {
      // pass the generated DSL to the callback
      return callback( null, searchQuery );
    }
  };
};
