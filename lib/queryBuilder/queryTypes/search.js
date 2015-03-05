/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Search Query Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to search for makes.
 * For documentation, see: https://github.com/mozilla/makeapi-client/blob/master/README.md
 */

var async = require("async");

var DEFAULT_SEARCH_SIZE = 10,
  MAX_SEARCH_SIZE = 1000;

var generators = require("../generators");

// if a field is to be negated (i.e. makes not containing the title "yolo"),
// the field will be prefixed with the following string (no quotes): "{!}"
var NOT_REGEX = /^\{!\}(.+)$/;

// detect if there is a matching search generator for a given field
function hasValidField(field) {
  return generators.search.KEYS.indexOf(field) !== -1;
}

// Validate a given size & checks if the value is in
// the correct bounds: >= 1 <= MAX_SEARCH_SIZE
function validateSize(size) {
  size = size && isFinite(size) ? size : DEFAULT_SEARCH_SIZE;
  if (size > MAX_SEARCH_SIZE) {
    return MAX_SEARCH_SIZE;
  } else if (size < 1) {
    return 1;
  }
  return size;
}

// Validate that the requested page is a number and is
// within correct bounds: page >= 0. Will also calculate
// the correct "from" value based on requested number of results
// see: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-from-size.html
function validatePage(page, size) {
  page = page && isFinite(page) ? page : 1;
  if (page < 1) {
    return 0;
  }
  return --page * size;
}

function generateFilters(queryData, callback) {
  var authenticated = queryData.authenticated,
    filterOccurence = queryData.filterOccurence,
    queryKeys = queryData.queryKeys,
    query = queryData.query,
    searchQuery;

  // If the request contains any of the filter generating keys, or defines a user search, use the advancedQuery object
  if (queryKeys.some(hasValidField) || queryData.user || queryData.likedByUser) {
    if (authenticated) {
      searchQuery = generators.queries.authenticatedQuery();
    } else {
      searchQuery = generators.queries.advancedQuery();
    }
    queryKeys.forEach(function (key) {
      var value = query[key],
        notRegexMatch;
      if (generators.search.KEYS.indexOf(key) !== -1) {
        notRegexMatch = NOT_REGEX.exec(value);
        if (notRegexMatch) {
          searchQuery.query.filtered.filter.bool[filterOccurence]
            .push(generators.search.filters[key](notRegexMatch[1], true));
        } else {
          searchQuery.query.filtered.filter.bool[filterOccurence]
            .push(generators.search.filters[key](value));
        }
      }
    });
  } else if (authenticated) {
    searchQuery = generators.queries.authenticatedQuery(true);
  } else {
    searchQuery = generators.queries.baseQuery();
  }
  queryData.searchQuery = searchQuery;
  callback(null, queryData);
}

function setSize(queryData, callback) {
  queryData.searchQuery.size = validateSize(queryData.size);
  callback(null, queryData);
}

function setFrom(queryData, callback) {
  queryData.searchQuery.from = validatePage(queryData.page, queryData.searchQuery.size);
  callback(null, queryData);
}

function sortQuery(queryData, callback) {
  var sort = queryData.sort,
    sortObj;
  if (sort) {
    sort = (Array.isArray(sort) ? sort : [sort]).filter(function (pair) {
      return typeof pair === "string" &&
        pair.length &&
        generators.sort.VALID_SORT_FIELDS.indexOf(pair.split(",")[0]) !== -1;
    });
    if (sort.length) {
      queryData.searchQuery.sort = [];
      sort.forEach(function (pair) {
        pair = pair.split(",");
        if (["likes", "reports"].indexOf(pair[0]) !== -1) {
          sortObj = generators.sort.generateScriptSort("doc['" + pair[0] + ".userId'].values.length", pair[1]);
        } else {
          sortObj = generators.sort.generateRegularSort(pair[0], pair[1]);
        }
        queryData.searchQuery.sort.push(sortObj);
      });
    }
  }
  callback(null, queryData);
}

function userQuery(queryData, callback) {
  if (!queryData.user) {
    return callback(null, queryData);
  }

  var notRegexMatch = NOT_REGEX.exec(queryData.user);
  if (notRegexMatch) {
    queryData.user = notRegexMatch[1];
  }
  generators.user({
    user: queryData.user,
    isOr: !!queryData.searchQuery.query.filtered.filter.bool.should.length,
    not: !!notRegexMatch
  }, function generationComplete(err, filter) {
    if (err) {
      return callback(err);
    }

    // add the returned user filter if it exists
    // it may not exist and not be erroneous if
    // the filters are running with the "or"
    // execution style.
    if (filter) {
      queryData.searchQuery.query.filtered.filter.bool[queryData.filterOccurence].push(filter);
    }

    // continue
    return callback(null, queryData);
  });
}

function likedByUserQuery(queryData, callback) {
  if (!queryData.likedByUser) {
    return callback(null, queryData);
  }

  generators.likedByUser(queryData.likedByUser, queryData.filterOccurence, function (err, filter) {
    if (err) {
      return callback(err);
    }

    if (filter) {
      queryData.searchQuery.query.filtered.filter.bool[queryData.filterOccurence].push(filter);
    }

    return callback(null, queryData);
  });
}

// DSL generator function - accepts an object that defines a query
// and a callback to pass the generated DSL to
module.exports = function (query, callback, authenticated) {
  if (!(query && query.constructor === Object) || !(callback && typeof callback === "function")) {
    throw new Error("Check your arguments.");
  }

  query.limit = +query.limit;
  query.page = +query.page;

  async.waterfall([
    function (cb) {
      return cb(null, {
        authenticated: authenticated,
        filterOccurence: query.or ? "should" : "must",
        likedByUser: query.likedByUser || "",
        page: query.page,
        queryKeys: Object.keys(query),
        query: query,
        size: query.limit,
        sort: query.sortByField,
        user: query.user || ""
      });
    },
    generateFilters,
    setSize,
    setFrom,
    sortQuery,
    userQuery,
    likedByUserQuery
  ], function (err, queryData) {
    if (err) {
      return callback(err);
    }
    callback(null, queryData.searchQuery);
  });
};
