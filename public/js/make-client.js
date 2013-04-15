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

    all: {
      searchFilters: [],
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
      withFields: function( fields ) {
        return this;
      },
      withLimit: function( num ) {
        this.size = parseInt( num ) || DEFAULT_SIZE;
        return this;
      },
      then: function( callback ) {
        var searchQuery = {
              query: {
                filtered: {
                  query: {
                    match_all: {}
                  },
                  filter: {
                    and: []
                  }
                }
              },
              size: this.size
            },
            searchFilters = this.searchFilters;

        for ( var i = 0; i < searchFilters.length; i++ ) {
          searchQuery.query.filtered.filter.and.push( searchFilters[ i ] );
        }

        this.size = DEFAULT_SIZE;
        this.searchFilters = [];

        doXHR( "POST", "/api/makes/search", searchQuery, callback );
      }
    },

    createMake: function createMake( makeOptions, callback ) {
      doXHR( "POST", "/api/make", makeOptions, callback );
      return this;
    },

    updateMake: function updateMake( id, makeOptions, callback ) {
      doXHR( "PUT", "/api/make/" + id, makeOptions, callback );
      return this;
    },

    deleteMake: function deleteMake( id, callback ) {
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
