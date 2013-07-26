/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( loginApi ) {
  if ( !loginApi ) {
    loginApi = require( "./loginapi" );
  }

  var DEFAULT_SEARCH_SIZE = 10,
      MAX_SEARCH_SIZE = 1000,
      NOT_REGEX = /^\{!\}/,
      VALID_SORT_FIELDS = [
        "author",
        "contentType",
        "description",
        "id",
        "remixedFrom",
        "title",
        "url",
        "createdAt",
        "updatedAt"
      ];

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
        query_string: {
          query: description,
          fields: [ "description" ],
          default_operator: "AND"
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
        query_string: {
          query: title,
          fields: [ "title" ],
          default_operator: "AND"
        }
      }, not );
    },

    url: function( url, not ) {
      return generateFilter( "term", {
        url: querystring.unescape( url )
      }, not );
    }
  };

  return {
    build: function( query, callback ) {
      if ( !( query && query.constructor === Object ) || !( callback && typeof callback === "function" ) ) {
        throw new Error( "Check your arguments." );
      }

      query.limit = +query.limit;
      query.page = +query.page;

      var searchQuery = {
            query: {
              filtered: {
                filter: {
                  bool: {
                    must: [{
                      missing: {
                        field: "deletedAt",
                        null_value: true
                      }
                    }],
                    should: [],
                    minimum_should_match: 1
                  }
                },
                query: {
                  match_all: {}
                }
              }
            }
          },
          size = query.limit && isFinite( query.limit ) ? query.limit : DEFAULT_SEARCH_SIZE,
          page = query.page && isFinite( query.page ) ? query.page : 1,
          user = query.user,
          sort = query.sortByField,
          filterOccurence = query.or ? "should" : "must",
          negateUser = false,
          sortObj;

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
            sortObj[ pair[ 0 ] ] = pair[ 1 ] || "desc";
            searchQuery.sort.push( sortObj );
          });
        }
      }

      Object.keys( query ).forEach(function( key ){
        value = query[ key ];
        if ( generators[ key ] ) {
          if ( NOT_REGEX.test( value ) ) {
            searchQuery.query.filtered.filter.bool[ filterOccurence ].push( generators[ key ]( value.substring( 3 ), true ) );
          } else {
            searchQuery.query.filtered.filter.bool[ filterOccurence ].push( generators[ key ]( value ) );
          }
        }
      });

      if ( user ) {
        if ( NOT_REGEX.test( user ) ) {
          user = user.substring( 3 );
          negateUser = true;
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
          }, negateUser );

          searchQuery.query.filtered.filter.bool[ filterOccurence ].push( filter );

          callback( null, searchQuery );
        });
      } else {
        callback( null, searchQuery );
      }
    }
  };
};
