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
    nop = function () {};

  var badArgList = [
    [],
    [undefined],
    [undefined, undefined]
    [null],
    [null, null],
    [undefined, null],
    [null, undefined],
    [{}],
    [null, nop],
    [nop, {}],
    ["foo", "bar"],
    [1, "bar"],
    ["bar", 1],
    [/lolwut/, nop],
    [nop, /lolwut/]
  ];

  return {
    base: function () {
      it("should exist", function () {
        assert(qb);
      });
      it("should have a build function", function () {
        assert(qb.search);
        assert.strictEqual(typeof qb.search, "function");
      });
    },
    badArgs: function () {
      badArgList.forEach(function (test, idx) {
        it("should throw - test #" + (idx + 1), function () {
          assert.throws(function () {
            qb.search.apply(qb, test);
          });
        });
      });
    },
    emptyQuery: function () {
      var err, query;

      before(function (done) {
        qb.search({}, function (e, q) {
          err = e;
          query = q;
          done();
        });
      });

      describe("empty query", function () {
        it("err should be null", function () {
          assert.strictEqual(err, null);
        });
        it("built query should match the defined base query", function () {
          assert.deepEqual(query, baseQuery);
        });
      });
    }
  };
};
