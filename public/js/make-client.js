"use strict";

(function( global ){

  // Search Constants
  const DEFAULT_SIZE = 10;

  // For Versioning
  var apiVersion = "@VERSION",

      makeAPI,
      searchOptions = [],
      querySet = false,

  // Shorthand for creating a Make Object
  Make = function Make( options ) {
    return new Make.fn.init( options );
  };

  function doXHR( type, path, data, callback ) {
    var request = new XMLHttpRequest();

    if ( typeof data === "function" ) {
      callback = data;
      data = {};
    }

    request.open( type, makeAPI + path, true );
    request.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
    request.onreadystatechange = function() {
      if ( this.readyState === 4 && this.status === 200 ) {
        callback( JSON.parse( this.responseText ) );
      }
    };
    request.send( JSON.stringify( data ) );
  }

  Make.fn = Make.prototype = {
    make: apiVersion,
    constructor: Make,

    /**
     * [init - initial setup of Make Object]
     * @param  {[type]} options - Configuration settings for querying the API
     * @return {[type]}
     */
    init: function init( options ) {
      options = options || {};

      if ( options.makeAPI ) {
        makeAPI = options.makeAPI;
      }

      return this;
    },

    one: {
      withId: function( id, callback ) {
        callback = callback || {};

        doXHR( "GET", "/api/make/" + id, callback );
        return this;
      }
    },

    all: {
      searchFilters: [],
      sortBy: [],
      size: DEFAULT_SIZE,
      withAuthor: function( name ) {
        this.searchFilters.push({
          query: {
            field: {
              author: name
            }
          }
        });
        return this;
      },
      withTags: function( tags, execution ) {
        this.searchFilters.push({
          terms: {
            tags: tags,
            execution: execution
          }
        });
        return this;
      },
      withTagPrefix: function( prefix ) {
        if ( !prefix || typeof prefix !== "string" ) {
          return this;
        }
        this.searchFilters.push({
          prefix: {
            "tags": prefix
          }
        });
        return this;
      },
      withFields: function( fields ) {
        return this;
      },
      limit: function( num ) {
        this.size = parseInt( num ) || DEFAULT_SIZE;
        return this;
      },
      sortByField: function( field, direction ) {
        if ( !field || typeof field !== "string" ) {
          return this;
        }
        var sortObj;
        if ( direction ) {
          sortObj = {};
          sortObj[ field ] = direction;
          this.sortBy.push( sortObj );
        } else {
          this.sortBy.push( field );
        }
        return this
      },
      then: function( callback ) {
        var searchQuery = {
              query: {
                filtered: {
                  query: {
                    match_all: {}
                  }
                }
              },
              size: this.size
            };

        if ( this.searchFilters.length ) {
          searchQuery.query.filtered.filter = {};
          searchQuery.query.filtered.filter.and = this.searchFilters;
        }

        if ( this.sortBy.length ) {
          searchQuery.sort = this.sortBy;
        }

        this.size = DEFAULT_SIZE;
        this.searchFilters = [];
        this.sortBy = [];

        doXHR( "POST", "/api/makes/search", searchQuery, callback );
      }
    },

    create: function create( options, callback ) {
      doXHR( "POST", "/api/make", options, callback );
      return this;
    },

    update: function update( id, options, callback ) {
      doXHR( "PUT", "/api/make/" + id, options, callback );
      return this;
    },

    remove: function remove( id, callback ) {
      doXHR( "DELETE", "/api/make/" + id, callback );
      return this;
    }

  };

  // Make functions chainable
  Make.fn.init.prototype = Make.fn;

  // support for requireJS
  if ( typeof define === "function" && define.amd ) {
    define(function() {
      return Make;
    });
  } else {
    global.Make = Make;
  }
})( this );
