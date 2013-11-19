/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 module.exports = function( qb ) {
  var core = require( "./core.unit" )( qb ),
      size = require( "./size.unit" )( qb ),
      page = require( "./page.unit" )( qb ),
      sizeAndLimit = require( "./limitSize.unit" )( qb ),
      sort = require( "./sort.unit" )( qb ),
      user = require( "./user.unit" )( qb ),
      filterTests = require( "./termFilters.unit" )( qb ),
      complexQueries = require( "./complexQueries.unit" )( qb ),
      tagFacets =  require( "./tagFacets.unit" )( qb );

  describe( "QueryBuilder: ", core.base );

  describe( "build() - bad args: ", core.badArgs );

  describe( "build() - empty query object: ", core.emptyQuery );

  describe( "build() - size(limit): ", size );

  describe( "build() - page: ", page );

  describe( "build() - size and limit: ", sizeAndLimit );

  describe( "build() - sort: ", sort );

  describe( "build() - user: ", user );

  describe( "build() - All Term filters: ", filterTests );

  describe( "build() - complexQueries: ", complexQueries );

  describe( "build() - tag facets: ", tagFacets );

};
