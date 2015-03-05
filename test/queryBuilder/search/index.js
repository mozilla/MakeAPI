/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe */

module.exports = function (qb) {
  var core = require("./core.unit")(qb),
    size = require("./size.unit")(qb),
    page = require("./page.unit")(qb),
    sizeAndLimit = require("./limitSize.unit")(qb),
    sort = require("./sort.unit")(qb),
    filterTests = require("./termFilters.unit")(qb),
    complexQueries = require("./complexQueries.unit")(qb),
    tagFacets = require("./tagFacets.unit")(qb);

  describe("QueryBuilder: ", core.base);

  describe("qb.search() - bad args: ", core.badArgs);

  describe("qb.search()", core.emptyQuery);

  describe("qb.search() - size(limit): ", size);

  describe("qb.search() - page: ", page);

  describe("qb.search() - size and limit: ", sizeAndLimit);

  describe("qb.search() - sort: ", sort);

  describe("qb.search() - All Term filters: ", filterTests);

  describe("qb.search() - complexQueries: ", complexQueries);

  describe("qb.search() - tag facets: ", tagFacets);
};
