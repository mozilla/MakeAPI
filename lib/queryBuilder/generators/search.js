/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This module generates Elastic Search query DSL filters for search queries
 * See: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filters.html
 */

var querystring = require( "querystring" );

/*
 * generateSearchFilter
 *
 * This is a helper generator for filters.
 * `type` is the type of filter to generate i.e. "term", "query", "prefix"
 * `map` is an object whose keys are copied onto the generated filter.
 * `not` is a boolean, if set to true, the filter is wrapped in a negation (not) filter
 */
function generateSearchFilter( type, map, not ) {
  var filter = {},
      filterType = filter[ type ] = {};

  Object.keys( map ).forEach(function( key ) {
    filterType[ key ] = map[ key ];
  });

  if ( not ) {
    return {
      not: filter
    };
  }
  return filter;
}

function generateTermsFilter( terms, field, not ) {
  var execution,
    filterObj = {};

  // terms will be a comma delimited list of terms provided in the request
  terms = terms.map(function( term ) {
    return term.trim();
  });

  // The first element will always indicate the type of execution
  // for ES to run the terms filter with.
  // For example, "the make should have terms a AND b" or
  // "the make should have term a OR term b"
  if ( terms[ 0 ] === "and" || terms[ 0 ] === "or" ) {
    execution = terms.splice( 0, 1 )[ 0 ];
  }

  filterObj[ field ] = terms;

  if ( execution ) {
    filterObj.execution = execution;
  }

  return generateSearchFilter( "terms", filterObj, not );
}

/*
 * The properties of this exported object map to properties on the make object model,
 * and return a filter to be added to the ES query.
 */
module.exports.filters = {
  author: function( name, not ) {
    return generateSearchFilter( "term", {
      author: name
    }, not );
  },

  contentType: function( contentType, not ) {
    return generateSearchFilter( "term", {
      contentType: contentType
    }, not );
  },

  description: function( description, not ) {
    return generateSearchFilter( "query", {
      match: {
        description: {
          query: description,
          operator: "and"
        }
      }
    }, not );
  },

  id: function( ids, not ) {
    // It's safe to try and split on ',' because it cannot be a character in an id
    ids = ids.split( "," );

    if ( ids.length === 1 ) {
      return generateSearchFilter( "query", {
        field: {
          _id: ids[ 0 ]
        }
      }, not );
    } else {
      return generateTermsFilter( ids, "_id", not );
    }
  },

  remixedFrom: function( id, not ) {
    return generateSearchFilter( "term", {
      remixedFrom: id
    }, not );
  },

  tags: function( tags, not ) {
    return generateTermsFilter( tags.split( "," ), "tags", not );
  },

  tagPrefix: function( prefix, not ) {
    return generateSearchFilter( "prefix", {
      tags: prefix
    }, not );
  },

  title: function( title, not ) {
    return generateSearchFilter( "query", {
      match: {
        title: {
          query: title,
          operator: "and"
        }
      }
    }, not );
  },

  url: function( url, not ) {
    return generateSearchFilter( "term", {
      url: querystring.unescape( url )
    }, not );
  }
};

// Export the keys of the filters object to help consumers determine if a filter is defined for a field
module.exports.KEYS = Object.keys( module.exports.filters );
