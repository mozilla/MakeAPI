/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This module generates sort instructions for elastic search queries
 * See: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-sort.html
 */

// export all valid sort fields that are defined on the make object model
module.exports.VALID_SORT_FIELDS = [
  "author",
  "contentType",
  "description",
  "id",
  "remixedFrom",
  "title",
  "url",
  "createdAt",
  "updatedAt",
  "likes",
  "reports"
];

// Generate a regular sort object for a given field
module.exports.generateRegularSort = function (type, order) {
  var sortObj = {};
  sortObj[type] = order || "desc";
  return sortObj;
};

/*
 * Generates a script based sort:
 * http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-sort.html#_script_based_sorting
 * Script language depends on your specific installation of ElasticSearch
 */
module.exports.generateScriptSort = function (script, order) {
  return {
    _script: {
      lang: "js",
      order: order || "desc",
      script: script,
      type: "number"
    }
  };
};
