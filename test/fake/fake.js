/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var mongo = {},
    seed = Date.now();

/**
 * Format search results like ES does
 */
function formatResults( results ) {
  results = results || [];
  if ( !Array.isArray( results ) ) {
    results = [ results ];
  }
  return { hits: results };
}

function finder( _id ) {
  var whereKey, whereVal;

  function where( key, val ) {
    whereKey = key;
    whereVal = val;
    return {
      exec: exec
    };
  }

  function exec( callback ) {
    var doc = mongo[ _id ];
    // == so we deal with undefined vs. null
    if ( !whereKey || doc [ whereKey ] == whereVal ) {
      callback( null, doc );
      return;
    }
    callback( null, null );
  }

  return {
    where: where,
    exec: exec
  };
}

function Make(){}

Make.publicFields = [ "url", "contentType", "locale", "locales", "title",
                      "description", "author", "published", "tags",
                      "thumbnail", "email", "remixedFrom" ];
/**
 * We support only a tiny subset of the ES DSL, specifically searching
 * by ID and searching for tags.
 *
 * A search for ID=1234 looks like this:
 * {
 *     query: {
 *         filtered: {
 *             query: {
 *                 match_all: {}
 *             },
 *             filter: {
 *                 and: [{
 *                         query: {
 *                             field: {
 *                                 _id: 1234
 *                             }
 *                         }
 *                     }
 *                 ]
 *             }
 *         }
 *     },
 *     size: 10,
 *     from: 0
 * }
 *
 * A search for the `foo` and `bar` tags looks like this:
 * s = {
 *     query: {
 *         filtered: {
 *             query: {
 *                 match_all: {}
 *             },
 *             filter: {
 *                 and: [{
 *                         terms: {
 *                             tags: [foo, bar],
 *                             execution: and
 *                         }
 *                     }
 *                 ]
 *             }
 *         }
 *     },
 *     size: 10,
 *     from: 0
 * }
 */
function findByTags( tags ) {
  var results = [];

  function matchTags( allTags, searchTags ) {
    allTags = allTags || [];
    return searchTags.every( function( tag ) {
      return allTags.indexOf( tag ) > -1;
    });
  }

  Object.keys( mongo ).forEach( function( key ) {
    var doc = mongo[ key ];
    if ( matchTags( doc.tags, tags ) ) {
      results.push( doc );
    }
  });

  return results;
}

function findByTerm( term ) {
  var name = Object.keys( term )[ 0 ],
      value = term[ name ],
      results = [];

  Object.keys( mongo ).forEach( function( key ) {
    var doc = mongo[ key ];
    if ( doc[ name ] === value ) {
      results.push( doc );
    }
  });
  return results;

}

function dslParse( searchData, callback ) {
  // In both the ID and Tags cases, we only care about the first `and` term
  var and0;
  try {
    and0 = searchData.query.filtered.filter.and[ 0 ];
  } catch( err ) {
    callback( "Error: ES DSL syntax was not formatted correctly for FakeAPI." );
    return;
  }

  // Find by ID
  if ( and0.query &&
       and0.query.field &&
       and0.query.field._id ) {
    Make.findById( and0.query.field._id ).exec( callback );
  }
  // Find by Tags
  else if ( and0.terms &&
            and0.terms.tags ) {
    callback( null, formatResults( findByTags( and0.terms.tags ) ) );
  }
  // Find by term (e.g., URL).
  else if ( and0.term )
    callback( null, formatResults( findByTerm( and0.term ) ) );
  // Everything else is unsupported...until you add it ;)
  else {
    callback( "Error: this use of the ES DSL is unsupported in FakeAPI." );
  }
}

Make.search = function( searchData, callback ){
  // We support a tiny subset of https://github.com/jamescarr/mongoosastic#advanced-queries
  dslParse( searchData, callback );
};

Make.findById = function( _id ) {
  return finder( _id );
};

Make.prototype.save = function( callback ) {
  this._id = seed++;
  this.createdAt = Date.now();
  this.updatedAt = Date.now();
  mongo[ this._id ] = this;
  callback( null, this );
};

module.exports = Make;
