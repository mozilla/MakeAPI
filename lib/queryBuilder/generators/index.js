/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( loginAPI ) {
  return {
    sort: require( "./sort" ),
    search: require( "./search" ),
    user: require( "./user" )( loginAPI ),
    queries: require( "./queries" )
  };
};
