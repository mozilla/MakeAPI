/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Search Constants
var DEFAULT_SIZE = 10;

// For Versioning
var apiVersion = "@VERSION",
    makeAPI, Make, module, request;

// Shim module so we can safely check what environment this is being included in.
module = module || undefined;

function doXHRServer( type, path, data, callback ) {
  if ( module ) {
    request({
      method: type,
      uri: path,
      json: data
    }, function( err, res, body ) {

      if ( err ) {
        callback( { error: err } );
        return;
      }

      if ( res.statusCode === 200 ) {
        callback( body );
      }
    });
  }
}

function doXHR( type, path, data, callback ) {

  if ( typeof data === "function" ) {
    callback = data;
    data = {};
  }

  path = makeAPI + path;

  if ( !module ) {
    var request = new XMLHttpRequest();

    request.open( type, path, true );
    request.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
    request.onreadystatechange = function() {
      if ( this.readyState === 4 && this.status === 200 ) {
        callback( JSON.parse( this.responseText ) );
      }
    };
    request.send( JSON.stringify( data ) );
  } else {
    doXHRServer( type, path, data, callback );
  }
}

// Shorthand for creating a Make Object
Make = function Make( options ) {
  makeAPI = options.makeAPI;

  return {
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
};

// Depending on the environment we need to export our "Make" object differently.
if ( module ) {
  request = require( "request" );
  // npm install makeapi support
  module.exports = Make;
} else if ( typeof define === "function" && define.amd ) {
  // Support for requirejs
  define(function() {
    return Make;
  });
} else {
  // Support for include on individual pages.
  window.Make = Make;
}
