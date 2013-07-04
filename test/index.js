/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var qb = require( "../lib/queryBuilder" )({
      getUser: function( user, cb ){
        if ( user === "webmaker" || user === "webmaker@mozillafoundation.org" ) {
          return cb( null, { email: "webmaker@mozillafoundation.org" } );
        } else if ( user === "fakemaker" || user === "fakemaker@mozillafoundation.org" ) {
          return cb();
        }
        cb( "error" );
      }
    });

// pull in test modules
var core = require( "./queryBuilder/core.unit" )( qb ),
    size = require( "./queryBuilder/size.unit" )( qb ),
    page = require( "./queryBuilder/page.unit" )( qb ),
    sizeAndLimit = require( "./queryBuilder/limitSize.unit" )( qb ),
    sort = require( "./queryBuilder/sort.unit" )( qb ),
    user = require( "./queryBuilder/user.unit" )( qb ),
    filterTests = require( "./queryBuilder/termFilters.unit" )( qb ),
    complexQueries = require( "./queryBuilder/complexQueries.unit" )( qb );

describe( "QueryBuilder", core.base );

describe( "build() - bad args", core.badArgs );

describe( "build() - empty query object", core.emptyQuery );

describe( "build() - size(limit)", size );

describe( "build() - page", page );

describe( "build() - size and limit", sizeAndLimit );

describe( "build() - sort", sort );

describe( "build() - user", user );

describe( "build() - All Term filters", filterTests );

describe( "build() - complexQueries", complexQueries );
