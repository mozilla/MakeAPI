/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( loginApi ) {
  if ( !loginApi ) {
    loginApi = require( "./loginapi" );
  }

  var DEFAULT_SEARCH_SIZE = 10,
      MAX_SEARCH_SIZE = 1000,
      NOT_REGEX = /^\{!\}(.+)$/,
      VALID_SORT_FIELDS = [
        "author",
        "contentType",
        "description",
        "id",
        "remixedFrom",
        "title",
        "url",
        "createdAt",
        "updatedAt",
        "likes"
      ],
      GENERATOR_KEYS = [];

  var querystring = require( "querystring" );

  function negateFilter( filter ) {
    return {
      not: filter
    };
  }

  function generateFilter( type, map, not ) {
    var filter = {};

    filter[ type ] = {};

    Object.keys( map ).forEach(function( key ) {
      filter[ type ][ key ] = map[ key ];
    });

    if ( not ) {
      return negateFilter( filter );
    }
    return filter;
  }

  function hasGeneratorKey( key ) {
    return GENERATOR_KEYS.indexOf( key ) !== -1;
  }

  var generators = {
    author: function( name, not ) {
      return generateFilter( "term", {
        author: name
      }, not );
    },

    contentType: function( contentType, not ) {
      return generateFilter( "term", {
        contentType: contentType
      }, not );
    },

    description: function( description, not ) {
      return generateFilter( "query", {
        match: {
          description: {
            query: description,
            operator: "and"
          }
        }
      }, not );
    },

    id: function( id, not ) {
      return generateFilter( "query", {
        field: {
          _id: id
        }
      }, not );
    },

    remixedFrom: function( id, not ) {
      return generateFilter( "term", {
        remixedFrom: id
      }, not );
    },

    tags: function( tags, not ) {
      var execution,
          tagOptions;

      tags = tags.split( "," ).map(function( tag ) {
        return tag.trim();
      });

      if ( tags[ 0 ] === "and" || tags[ 0 ] === "or" ) {
        execution = tags.splice( 0, 1 )[ 0 ];
      }

      tagOptions = {
        tags: tags
      };

      if ( execution ) {
        tagOptions.execution = execution;
      }

      return generateFilter( "terms", tagOptions, not );
    },

    tagPrefix: function( prefix, not ) {
      return generateFilter( "prefix", {
        tags: prefix
      }, not );
    },

    title: function( title, not ) {
      return generateFilter( "query", {
        match: {
          title: {
            query: title,
            operator: "and"
          }
        }
      }, not );
    },

    url: function( url, not ) {
      return generateFilter( "term", {
        url: querystring.unescape( url )
      }, not );
    }
  };

  function buildQuery( query, customFilter, callback ) {
    if ( !( query && query.constructor === Object ) || !( callback && typeof callback === "function" ) ) {
      throw new Error( "Check your arguments." );
    }

    query.limit = +query.limit;
    query.page = +query.page;

    // baseQuery is the most basic query we can make.
    // advancedQuery is used if we need to generate filters, and wraps around baseQuery.
    var baseQuery = {
          query: {
            filtered: {
              query: {
                match_all: {}
              },
              filter: customFilter || {}
            }
          }
        },
        advancedQuery = {
          query: {
            filtered: {
              filter: {
                bool: {
                  must: [],
                  should: []
                }
              },
              query: baseQuery.query
            }
          }
        },
        searchQuery = {},
        size = query.limit && isFinite( query.limit ) ? query.limit : DEFAULT_SEARCH_SIZE,
        page = query.page && isFinite( query.page ) ? query.page : 1,
        user = query.user,
        sort = query.sortByField,
        filterOccurence = query.or ? "should" : "must",
        sortObj,
        notRegexMatch;

    // If the request contains any of the filter generating keys, or defines a user search, use the advancedQuery object
    if ( Object.keys( query ).some( hasGeneratorKey ) || user ) {
      searchQuery = advancedQuery;
      Object.keys( query ).forEach(function( key ){
        value = query[ key ];
        if ( generators[ key ] ) {
          notRegexMatch = NOT_REGEX.exec( value );
          if ( notRegexMatch ) {
            searchQuery.query.filtered.filter.bool[ filterOccurence ].push( generators[ key ]( notRegexMatch[ 1 ], true ) );
          } else {
            searchQuery.query.filtered.filter.bool[ filterOccurence ].push( generators[ key ]( value ) );
          }
        }
      });
    } else {
      searchQuery = baseQuery;
    }

    // set size and from and sort
    if ( size > MAX_SEARCH_SIZE ) {
      size = MAX_SEARCH_SIZE;
    } else if ( size < 1 ) {
      size = 1;
    }
    searchQuery.size = size;

    if ( page < 1 ) {
      page = 1;
    }
    searchQuery.from = ( page - 1 ) * size;

    if ( sort ) {
      sort = ( Array.isArray( sort ) ? sort : [ sort ] ).filter(function( pair ) {
        return typeof pair === "string" && pair.length && VALID_SORT_FIELDS.indexOf( pair.split( "," )[ 0 ] ) !== -1;
      });

      if ( sort.length ) {
        searchQuery.sort = [];
        sort.forEach(function( pair ){
          pair = pair.split( "," );
          sortObj = {};
          if ( pair[ 0 ] === "likes" ) {
            sortObj._script = {
              lang: "js",
              order: pair[ 1 ],
              script: "doc['likes.userId'].values.length",
              type: "number"
            };
          } else {
            sortObj[ pair[ 0 ] ] = pair[ 1 ] || "desc";
          }
          searchQuery.sort.push( sortObj );
        });
      }
    }

    if ( user ) {
      notRegexMatch = NOT_REGEX.exec( user );
      if ( notRegexMatch ) {
        user = notRegexMatch[ 1 ];
      }
      loginApi.getUser( user, function( err, userData ) {
        if ( err ) {
          callback({
            error: err,
            code: 500
          });
          return;
        }

        if ( !userData ) {
          if ( searchQuery.query.filtered.filter.bool.should.length ) {
            // If this is an OR filtered query, ignore the undefined user
            callback( null, searchQuery );
          } else {
            callback( { code: 404 } );
          }
          return;
        }

        var filter = generateFilter( "term", {
          email: userData.email
        }, !!notRegexMatch );

        searchQuery.query.filtered.filter.bool[ filterOccurence ].push( filter );
        callback( null, searchQuery );
      });
    } else {
      callback( null, searchQuery );
    }
  }

  // capture valid query generator keys
  GENERATOR_KEYS = Object.keys( generators );

  return {
    build: function( query, callback ) {
      buildQuery( query, {
        and: [
          {
            missing: {
              field: "deletedAt",
              null_value: true
            }
          },
          {
            term: {
              published: true
            }
          }
        ]
      }, callback );
    }
  };
};
