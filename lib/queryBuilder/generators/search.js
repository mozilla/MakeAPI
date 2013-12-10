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

  id: function( id, not ) {
    return generateSearchFilter( "query", {
      field: {
        _id: id
      }
    }, not );
  },

  ids: function( ids, not ) {
    ids = ids.split( ",");

    return generateSearchFilter( "terms", {
      _id: ids,
      execution: "or"
    }, not);
  },

  remixedFrom: function( id, not ) {
    return generateSearchFilter( "term", {
      remixedFrom: id
    }, not );
  },

  tags: function( tags, not ) {
    var execution,
        tagOptions;

    // tags will be a comma delimited list of words generated
    // by the makeapi-client library's search API
    tags = tags.split( "," ).map(function( tag ) {
      return tag.trim();
    });

    // The first element will always indicate the type of execution
    // for ES to run the tag filter with.
    // For example, "the make should have tags a AND b" or
    // "the make should have tag a OR tag b"
    if ( tags[ 0 ] === "and" || tags[ 0 ] === "or" ) {
      execution = tags.splice( 0, 1 )[ 0 ];
    }

    tagOptions = {
      tags: tags
    };

    if ( execution ) {
      tagOptions.execution = execution;
    }

    return generateSearchFilter( "terms", tagOptions, not );
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
