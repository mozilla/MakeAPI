/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert");

  var tests = [{
    page: 2,
    limit: 2,
    expected: {
      from: 2,
      size: 2
    }
  }, {
    page: 2000,
    limit: 4,
    expected: {
      from: 7996,
      size: 4
    }
  }, {
    page: "2",
    limit: 6,
    expected: {
      from: 6,
      size: 6
    }
  }, {
    page: "2000",
    limit: 8,
    expected: {
      from: 15992,
      size: 8
    }
  }, {
    page: NaN,
    limit: 10,
    expected: {
      from: 0,
      size: 10
    }
  }, {
    page: "NaN",
    limit: function () {},
    expected: {
      from: 0,
      size: 10
    }
  }, {
    page: /lolwut/,
    limit: Infinity,
    expected: {
      from: 0,
      size: 10
    }
  }, {
    page: void 0,
    limit: -Infinity,
    expected: {
      from: 0,
      size: 10
    }
  }, {
    page: null,
    limit: [],
    expected: {
      from: 0,
      size: 10
    }
  }, {
    page: Infinity,
    limit: 0x02FA,
    expected: {
      from: 0,
      size: 762
    }
  }];

  return function () {
    tests.forEach(function (test) {
      describe("size = " + test.size + " limit = " + test.limit, function () {
        var result = {};

        before(function (done) {
          qb.search({
            page: test.page,
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
          it("from and size match expected", function () {
            assert.strictEqual(result.query.from, test.expected.from);
            assert.strictEqual(result.query.size, test.expected.size);
          });
        });
      });
    });
  };
};
