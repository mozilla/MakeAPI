/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert");

  var tests = [{
    limit: 1,
    expected: 1
  }, {
    limit: -1,
    expected: 1
  }, {
    limit: 1001,
    expected: 1000
  }, {
    limit: "1",
    expected: 1
  }, {
    limit: "-1",
    expected: 1
  }, {
    limit: "1001",
    expected: 1000
  }, {
    limit: NaN,
    expected: 10
  }, {
    limit: "NaN",
    expected: 10
  }, {
    limit: /lolwut/,
    expected: 10
  }, {
    limit: void 0,
    expected: 10
  }, {
    limit: null,
    expected: 10
  }, {
    limit: Infinity,
    expected: 10
  }];

  return function () {
    tests.forEach(function (test) {
      describe("limit = " + test.limit, function () {
        var result = {};

        before(function (done) {
          qb.search({
            limit: test.limit
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
          it("query.size should be set to " + test.expected, function () {
            assert.strictEqual(result.query.size, test.expected);
          });
        });
      });
    });
  };
};
