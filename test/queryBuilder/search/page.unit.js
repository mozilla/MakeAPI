/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert");

  var tests = [{
    page: 2,
    expected: 10
  }, {
    page: 2000,
    expected: 19990
  }, {
    page: "2",
    expected: 10
  }, {
    page: "2000",
    expected: 19990
  }, {
    page: NaN,
    expected: 0
  }, {
    page: "NaN",
    expected: 0
  }, {
    page: /lolwut/,
    expected: 0
  }, {
    page: void 0,
    expected: 0
  }, {
    page: null,
    expected: 0
  }, {
    page: Infinity,
    expected: 0
  }];

  return function () {
    tests.forEach(function (test) {
      describe("page = " + test.page, function () {
        var result = {};

        before(function (done) {
          qb.search({
            page: test.page
          }, function (err, query) {
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
          it("query.from should be set to " + test.expected, function () {
            assert.strictEqual(result.query.from, test.expected);
          });
        });
      });
    });
  };
};
