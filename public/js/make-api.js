/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Search Constants
var DEFAULT_SIZE = 10;

// For Versioning
var apiVersion = "@VERSION",
    makeAPI, Make, module, request,
    escape;

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
  } else if ( typeof data === "string" ) {
    path += "?s=" + data;
    data = {};
  }

  path = makeAPI + path;

  if ( !module ) {
    var request = new XMLHttpRequest();

    request.open( type, path, true );
    request.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
    request.onreadystatechange = function() {
      if ( this.readyState === 4 ) {
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

  var MakeMap = {
      author: function( name ) {
        return {
          query: {
            field: {
              author: name
            }
          }
        };
      },
      tags: function( tagOptions ) {
        if ( typeof tagOptions.tags === "string" ) {
          tagOptions.tags = [ tagOptions.tags ];
        }

        return {
          terms: tagOptions
        };
      },
      field: function( field, direction ) {
        var sortObj;
        if ( direction ) {
          sortObj = {};
          sortObj[ field ] = direction;
          return sortObj;
        }

        return field;
      },
      limit: function ( num ) {
        return parseInt( num ) || DEFAULT_SIZE;
      },
      id: function( id ) {
        return {
          query: {
            field: {
              "_id": id
            }
          }
        };
      },
      tagPrefix: function( prefix ) {
        return {
          prefix: {
            "tags": prefix
          }
        };
      },
      url: function( makeUrl ) {
        return {
          term: {
            url: escape( makeUrl )
          }
        };
      }
    },
    BASE_QUERY = {
      query: {
        filtered: {
          query: {
            match_all: {}
          }
        }
      }
    };

  return {
    searchFilters: [],
    sortBy: [],
    size: DEFAULT_SIZE,

    find: function( options ) {
      options = options || {};

      for ( var key in options ) {
        if ( options.hasOwnProperty( key ) && MakeMap[ key ] ) {
          if ( key === "field" ) {
            this.sortedBy.push( MakeMap[ key ]( options[ key ] ) );
          } else {
            this.searchFilters.push( MakeMap[ key ]( options[ key ] ) );
          }
        }
      }

      return this;
    },

    author: function( name ) {
      this.searchFilters.push( MakeMap.author( name ) );
      return this;
    },

    tags: function( tagOptions ) {
      this.searchFilters.push( MakeMap.tags( tagOptions ) );
      return this;
    },

    tagPrefix: function( prefix ) {
      if ( !prefix || typeof prefix !== "string" ) {
        return this;
      }

      this.searchFilters.push( MakeMap.tagPrefix( prefix ) );

      return this;
    },

    limit: function( num ) {
      this.size = MakeMap.limit( num );
      return this;
    },

    field: function( field, direction ) {
      if ( !field || typeof field !== "string" ) {
        return this;
      }

      this.sortBy.push( MakeMap.field( field, direction ) );

      return this;
    },

    url: function( makeUrl ) {
      this.searchFilters.push( MakeMap.url( makeUrl ) );
      return this;
    },

    id: function( id ) {
      this.searchFilters.push( MakeMap.id( id ) );
      return this;
    },

    then: function( callback ) {
      var searchQuery = BASE_QUERY;

      searchQuery.size = this.size;

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

      doXHR( "GET", "/api/makes/search", escape( JSON.stringify( searchQuery ) ), callback );
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
  escape = require( "querystring" ).escape;
  // npm install makeapi support
  module.exports = Make;
} else if ( typeof define === "function" && define.amd ) {
  escape = window.encodeURIComponent;
  // Support for requirejs
  define(function() {
    return Make;
  });
} else {
  escape = window.encodeURIComponent;
  // Support for include on individual pages.
  window.Make = Make;
}
