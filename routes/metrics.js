/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true */

"use strict";

module.exports = function( routes ) {
  return {
    makeAll: function ( req, res ) {
      routes.metricsAPI( req, res, {
        "user": req.session.username,
        "metric": "all",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    },
    makeDay: function ( req, res ) {
      routes.metricsAPI( req, res, {
        "user": req.session.username,
        "metric": "day",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    },
    makeWeek: function ( req, res ) {
      routes.metricsAPI(req, res, {
        "user": req.session.username,
        "metric": "week",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    },
    remixAll: function ( req, res ) {
      routes.metricsAPI( req, res, {
        "user": req.session.username,
        "metric": "remixAll",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    },
    remixDay: function ( req, res ) {
      routes.metricsAPI( req, res, {
        "user": req.session.username,
        "metric": "remixDay",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    },
    remixWeek: function ( req, res ) {
      routes.metricsAPI( req, res, {
        "user": req.session.username,
        "metric": "remixWeek",
        "contentType": "application/x-thimble",
        "limit": 50,
        "sortByField": "updatedAt,desc",
        "page": 1
      });
    }
  };
};