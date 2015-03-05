/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This module contains generic helper functions for generating filters
 */

/*
 * generateSearchFilter
 *
 * This is a helper generator for filters.
 * `type` is the type of filter to generate i.e. "term", "query", "prefix"
 * `map` is an object whose keys are copied onto the generated filter.
 * `not` is a boolean, if set to true, the filter is wrapped in a negation (not) filter
 */
function generateSearchFilter(type, map, not) {
  var filter = {},
    filterType = filter[type] = {};

  Object.keys(map).forEach(function (key) {
    filterType[key] = map[key];
  });

  if (not) {
    return {
      not: filter
    };
  }
  return filter;
}

function generateTermsFilter(terms, field, not) {
  var execution,
    filterObj = {};

  // terms will be a comma delimited list of terms provided in the request
  terms = terms.map(function (term) {
    return term.trim();
  });

  // The first element will always indicate the type of execution
  // for ES to run the terms filter with.
  // For example, "the make should have terms a AND b" or
  // "the make should have term a OR term b"
  if (terms[0] === "and" || terms[0] === "or") {
    execution = terms.splice(0, 1)[0];
  }

  filterObj[field] = terms;

  if (execution) {
    filterObj.execution = execution;
  }

  return generateSearchFilter("terms", filterObj, not);
}

module.exports = {
  generateSearchFilter: generateSearchFilter,
  generateTermsFilter: generateTermsFilter
};
