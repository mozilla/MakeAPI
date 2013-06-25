/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Shim module so we can safely check what environment this is being included in.
var module = module || undefined;

(function ( module ) {
  "use strict";

  // Search Constants
  var DEFAULT_SIZE = 10;

  var Make,
      xhrStrategy,
      apiURL,
      auth,
      user,
      pass,
      csrfToken,
      request;

  function nodeStrategy( type, path, data, callback ) {
    // Only use auth if provided
    var authObj = ( user && pass ) ? {
        username: user,
        password: pass,
        sendImmediately: true
      } : undefined;

    request({
      auth: authObj,
      method: type,
      uri: path,
      json: data
    }, function( err, res, body ) {

      if ( err ) {
        callback( err );
        return;
      }

      if ( res.statusCode === 200 ) {
        return callback( null, body );
      }

      // There was an error of some sort, and the body contains the reason why
      callback( body.error );
    });
  }

  function browserStrategy( type, path, data, callback ) {
    var request = new XMLHttpRequest();

    if ( auth ) {
      request.open( type, path, true, user, pass );
    } else {
      request.open( type, path, true );
    }
    if ( csrfToken ) {
      request.setRequestHeader( "x-csrf-token", csrfToken );
    }
    request.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
    request.onreadystatechange = function() {
      var response,
          error;
      if ( this.readyState === 4 ) {
        try {
          response = JSON.parse( this.responseText ),
          error = response.error;
        }
        catch ( exception ) {
          error = exception;
        }
        if ( error ) {
          callback( error );
        } else {
          callback( null, response );
        }
      }
    };
    request.send( JSON.stringify( data ) );
  }

  function doXHR( type, path, data, callback ) {

    if ( typeof data === "function" ) {
      callback = data;
      data = {};
    } else if ( typeof data === "string" ) {
      path += "?s=" + data;
      data = {};
    }

    path = apiURL + path;

    xhrStrategy( type, path, data, callback );
  }

  // Extend a make with some API sugar.
  function wrap( make, options ) {

    function getMakeInstance() {
      if ( !getMakeInstance.instance ) {
        getMakeInstance.instance = Make( options );
      }
      return getMakeInstance.instance;
    }

    // Lazily extract various tags types as needed, and memoize.
    function lazyInitTags( o, name, regexp ) {
      delete o[ name ];
      var tags = [];
      make.tags.forEach( function( tag ) {
        if( regexp.test( tag ) ) {
          tags.push( tag );
        }
      });
      o[ name ] = tags;
      return tags;
    }

    var wrapped = {
      // Application Tags are "webmaker.org:foo", which means two
      // strings, joined with a ':', and the first string does not
      // contain an '@'
      get appTags() {
        return lazyInitTags( this, 'appTags', /^[^@]+\:[^:]+/ );
      },

      // User Tags are "some@something.com:foo", which means two
      // strings, joined with a ':', and the first string contains
      // an email address (i.e., an '@').
      get userTags() {
        return lazyInitTags( this, 'userTags', /^[^@]+@[^@]+\:[^:]+/ );
      },

      // Raw Tags are "foo" or "#fooBar", which means one string
      // which does not include a colon.
      get rawTags() {
        return lazyInitTags( this, 'rawTags', /^[^:]+$/ );
      },

      // Determine whether this make is tagged with any of the tags
      // passed into `tags`.  This can be a String or [ String ],
      // and the logic is OR vs. AND for multiple.
      taggedWithAny: function( tags ) {
        var any = false,
            all = make.tags;
        tags = Array.isArray( tags ) ? tags : [ tags ];
        for( var i = 0; i < tags.length; i++ ) {
          if ( all.indexOf( tags[ i ] ) > -1 ) {
            return true;
          }
        }
        return false;
      },

      // Get a list of other makes that were remixed from this make.
      // The current make's URL is used as a key.
      remixes: function( callback ) {
        callback = callback || function(){};
        getMakeInstance()
        .find({ remixedFrom: wrapped._id })
        .then( callback );
      },

      // Similar to remixes(), but filter out only those remixes that
      // have a different locale (i.e., are localized versions of this
      // make).
      locales: function( callback ) {
        callback = callback || function(){};
        this.remixes( function( err, results ) {
          if( err ) {
            callback( err );
            return;
          }
          var locales = [];
          results.forEach( function( one ) {
            if ( one.locale !== wrapped.locale ) {
              locales.push( one );
            }
          });
          callback( null, locales );
        });
      },

      // Get the original make used to create this remix. Null is sent
      // back in the callback if there was no original (not a remix)
      original: function( callback ) {
        callback = callback || function(){};
        if ( !wrapped.remixedFrom ) {
          callback( null, null );
          return;
        }
        getMakeInstance()
        .find({ _id: wrapped._id })
        .then( callback );
      },

      update: function( email, callback ) {
        callback = callback || function(){};
        getMakeInstance()
        .update( wrapped._id, { maker: email, make: wrapped }, callback );
      }

    };

    // Extend wrapped with contents of make
    [ "url", "contentType", "locale", "title",
      "description", "author", "published", "tags", "thumbnail",
      "username", "remixedFrom", "_id", "emailHash", "createdAt",
      "updatedAt" ].forEach( function( prop ) {
        wrapped[ prop ] = make[ prop ];
    });

    // Virtuals will only be exposed while still on the server end
    // forcing us to still manually expose it for client side users.
    wrapped.id = wrapped._id;

    return wrapped;
  }

  // Shorthand for creating a Make Object
  Make = function Make( options ) {
    apiURL = options.apiURL;
    auth = options.auth;

    if ( auth ) {
      auth = auth.split( ":" );
      user = auth[ 0 ];
      pass = auth[ 1 ];
    }

    if ( options.csrf ) {
      csrfToken = options.csrf;
    }

    return {
      searchFilters: [],
      sortBy: [],
      size: DEFAULT_SIZE,
      pageNum: 1,
      makerID: "",

      find: function( options ) {
        options = options || {};

        for ( var key in options ) {
          if ( options.hasOwnProperty( key ) && this[ key ] ) {
            this[ key ]( options[ key ] );
          }
        }

        return this;
      },

      author: function( name ) {
        this.searchFilters.push({
          term: {
            author: name
          }
        });
        return this;
      },

      user: function( id ) {
        this.makerID = id;
        return this;
      },

      tags: function( options ) {
        var tagOptions = {
              tags: options.tags || options,
              execution: options.execution || "and"
            };
        if ( typeof tagOptions.tags === "string" ) {
          tagOptions.tags = [ tagOptions.tags ];
        }

        this.searchFilters.push({
          terms: tagOptions
        });
        return this;
      },

      tagPrefix: function( prefix ) {
        if ( !prefix || typeof prefix !== "string" ) {
          return this;
        }

        this.searchFilters.push({
          prefix: {
            tags: prefix
          }
        });

        return this;
      },

      limit: function( num ) {
        var val = +num;
        // Check that val is a positive, whole number
        if ( typeof val === "number" && val > 0 && val % 1 === 0 ) {
          this.size = val;
        }
        return this;
      },

      page: function( num ) {
        var val = +num;
        if ( typeof val === "number" && val > 0 && val % 1 === 0 ) {
          this.pageNum = val;
        }
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
          field = sortObj;
        }

        this.sortBy.push( field );

        return this;
      },

      url: function( makeUrl ) {
        this.searchFilters.push({
          term: {
            url: escape( makeUrl )
          }
        });
        return this;
      },

      contentType: function( contentType ) {
        this.searchFilters.push({
          term: {
            contentType: contentType
          }
        });
        return this;
      },

      remixedFrom: function( projectID ) {
        this.searchFilters.push({
          term: {
            remixedFrom: projectID
          }
        });
        return this;
      },

      id: function( id ) {
        this.searchFilters.push({
          query: {
            field: {
              _id: id
            }
          }
        });
        return this;
      },

      title: function( title ) {
        this.searchFilters.push({
          query: {
            query_string: {
              query: title,
              fields: [ "title" ],
              default_operator: "AND"
            }
          }
        });
        return this;
      },

      description: function( description ) {
        this.searchFilters.push({
          query: {
            query_string: {
              query: description,
              fields: [ "description" ],
              default_operator: "AND"
            }
          }
        });
        return this;
      },

      then: function( callback ) {
        var searchQuery = {
          query: {
            filtered: {
              filter: {
                and: [{
                  missing: {
                    field: "deletedAt",
                    null_value: true
                  }
                }]
              },
              query: {
                match_all: {}
              }
            }
          }
        };

        searchQuery.size = this.size;
        searchQuery.from = ( this.pageNum - 1 ) * this.size;

        if ( Array.isArray( this.searchFilters )) {
          searchQuery.query.filtered.filter.and = searchQuery.query.filtered.filter.and.concat( this.searchFilters );
        }

        if ( this.sortBy.length ) {
          searchQuery.sort = this.sortBy;
        }

        if ( this.makerID ) {
          searchQuery.makerID = this.makerID;
          this.makerID = "";
        }

        this.size = DEFAULT_SIZE;
        this.pageNum = 1;
        this.searchFilters = [];
        this.sortBy = [];

        doXHR( "GET", "/api/makes/search",
          escape( JSON.stringify( searchQuery ) ),
          function( err, data ) {
            if ( err ) {
              callback( err );
            } else {
              // Wrap resulting makes with some extra API.
              var hits = data.makes;
              for( var i = 0; i < hits.length; i++ ) {
                hits[ i ] = wrap( hits[ i ], options );
              }
              callback( null, hits, data.total );
            }
          }
        );
      },

      // Options should be of the form: { maker: "email@address", make: {...} }
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
  if ( typeof module !== 'undefined' && module.exports ) {
    request = require( "request" );
    // npm install makeapi support
    xhrStrategy = nodeStrategy;
    module.exports = Make;
  } else {
    xhrStrategy = browserStrategy;
    if ( typeof define === "function" && define.amd ) {
      // Support for requirejs
      define(function() {
        return Make;
      });
    } else {
      // Support for include on individual pages.
      window.Make = Make;
    }
  }
}( module ));
