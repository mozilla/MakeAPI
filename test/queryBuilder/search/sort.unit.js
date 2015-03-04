/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert"),
    baseQuery = {
      query: {
        filtered: {
          query: {
            match_all: {}
          },
          filter: {
            bool: {
              must: [{
                missing: {
                  field: "deletedAt",
                  null_value: true
                }
              }, {
                term: {
                  published: true
                }
              }],
              should: []
            }
          }
        }
      },
      size: 10,
      from: 0
    },
    validSortFields = [
      "author",
      "contentType",
      "description",
      "id",
      "remixedFrom",
      "title",
      "url",
      "createdAt",
      "updatedAt"
    ],
    validDirections = [
      "",
      ",asc",
      ",desc"
    ],
    ignoredInvalidFields = [{
      sortByField: 1
    }, {
      sortByField: "Invalid"
    }, {
      sortByField: {
        "invalid": "arg"
      }
    }];

  return function () {
    ignoredInvalidFields.forEach(function (test) {
      describe("Ignored - SortByField = " + test.sortByField, function () {
        var result = {};

        before(function (done) {
          qb.search(test, function (err, query) {
            result.err = err;
            result.query = query;
            done();
          });
        });

        describe("Built Query:", function () {
          it("err should be null", function () {
            assert.strictEqual(result.err, null);
          });
          it("query should be defined", function () {
            assert(result.query);
          });
          it("The invalid sort field should have been ignored", function () {
            assert.deepEqual(result.query, baseQuery);
          });
        });
      });
    });

    validSortFields.forEach(function (field) {
      validDirections.forEach(function (direction) {
        describe("Valid - SortByField = " + field + (direction ? " direction = " + direction : ""), function () {
          var result = {};

          before(function (done) {
            qb.search({
              sortByField: direction ? field + direction : field
            }, function (err, query) {
              result.err = err;
              result.query = query;
              done();
            });
          });

          describe("Built Query", function () {
            it("err should be null", function () {
              assert.strictEqual(result.err, null);
            });
            it("query should be defined", function () {
              assert(result.query);
            });
            it("The sort field should have been created for " + field, function () {
              var passObj = {};
              passObj[field] = direction ? direction.substr(1) : "desc";
              assert.deepEqual(result.query.sort[0], passObj);
            });
          });
        });
      });
    });
  };
};
