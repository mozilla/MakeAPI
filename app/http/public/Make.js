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

      if ( options.makeAPI ) {
        makeAPI = options.makeAPI;
      }

      return this;
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
    },

    /**
     * [getLatestMakes - Get the most recently created Makes]
     * @param  {[Object]} options
     * @return {[Make]}
     */
    getLatestMakes: function getLatestMakes( options ) {
      if ( !querySet ) {
        options = options || {};
        searchOptions.push( { query: options, type: "match_all" } );
        querySet = true;
      }
      return this;
    },

    /**
     * [getAuthorsMakes - Get Makes by Author Name]
     * @param  {[Object]} options
     * @return {[Make]}
     */
    getAuthorsMakes: function getAuthorsMakes( options ) {
      if ( !querySet ) {
        options = options || {};
        searchOptions.push( { query: options, type: "field" } );
        querySet = true;
      }
      return this;
    },

    /**
     * [getByTags - Get Makes by tags]
     * @param  {[Object]} options
     * @return {[Make]}
     */
    getByTags: function getByTags( options ) {
      if ( !querySet ) {
        options = options || {};
        searchOptions.push( { query: options, type: "terms" } );
        querySet = true;
      }
      return this;
    },

    /**
     * [withTags - Add a filter for specific tags]
     * @param  {[type]} options
     * @return {[Make]}
     */
    withTags: function withTags( options ) {
      if ( querySet ) {
        options = options || {};
        searchOptions.push( { filter: options, type: "terms" } );
      }
      return this;
    },

    /**
     * [size - Specifies the amount of results to be returned by the API]
     * @param  {[Integer]} num
     * @return {[Make]}
     */
    size: function size( num ){
      if ( querySet ) {
        num = parseInt( num ) || DEFAULT_SIZE;
        searchOptions.push( { size: num } );
      }
      return this;
    },

    /**
     * [run - Make the call to the MakeAPI]
     * @param  {[Function]} callback
     * @return {[type]}
     */
    run: function run( callback ) {
      var searchQuery = { query: {} },
          initialQuery, options, type, filterObj;

      callback = callback || function(){};

      if ( querySet ) {
        querySet = false;
        for ( var i = 0; i < searchOptions.length; i++ ) {
          options = searchOptions[ i ];

          if ( options.hasOwnProperty( "query" ) ) {
            searchQuery.query[ options.type ] = options.query;
            initialQuery = options;
          } else if ( options.hasOwnProperty( "filter" ) ) {
            type = options.type;

            if ( !searchQuery.filtered ) {
              searchQuery.query = {};
              searchQuery.query.filtered = {};
              searchQuery.query.filtered.query = {};
              searchQuery.query.filtered.query[ initialQuery.type ] = initialQuery.query;
              searchQuery.query.filtered.filter = { and: [] };
              filterObj = {};
              filterObj[ type ] = options.filter;
              searchQuery.query.filtered.filter.and.push( filterObj );
            } else {
              filterObj = {};
              filterObj[ type ] = options.filter;
              searchQuery.query.filtered.filter.and.push( filterObj );
            }
          } else if ( options.hasOwnProperty( "size" ) ) {
            searchQuery.size = options.size;
          }
        }

        searchOptions = [];

        doXHR( "POST", "/api/makes/search", searchQuery, callback );
      } else {
        callback( { error: "No base query was set" } );
      }

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
