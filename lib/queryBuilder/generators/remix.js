/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This module generates an Elastic Search query DSL range filter for remixCount queries
 * See: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filters.html
 */

var generic = require("./generic");

/*
 * The properties of this exported object map to properties on the make object model,
 * and return a filter to be added to the ES query.
 */
module.exports = function (from, to, not) {
  return generic.generateSearchFilter("range", {
    createdAt: {
      gte: +from,
      lte: +to
    }
  });
};
