/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert");

  var tests = [{
    query: {
      limit: 10,
      page: 3,
      tags: "{!}or,tag,tag2,tag3",
      url: "https://mozilla.org"
    },
    filters: [{
      not: {
        terms: {
          tags: [
            "tag",
            "tag2",
            "tag3"
          ],
          execution: "or"
        }
      }
    }, {
      term: {
        url: "https://mozilla.org"
      }
    }],
    attributes: [{
      attr: "size",
      value: 10
    }, {
      attr: "from",
      value: 20
    }]
  }, {
    query: {
      limit: 5,
      title: "This is a title",
      tagPrefix: "foo"
    },
    filters: [{
      query: {
        match: {
          title: {
            query: "This is a title",
            operator: "and"
          }
        }
      }
    }, {
      prefix: {
        tags: "foo"
      }
    }],
    attributes: [{
      attr: "size",
      value: 5
    }]
  }, {
    query: {
      limit: 1,
      page: 20,
      id: "{!}randomid",
      contentType: "application/x-type"
    },
    filters: [{
      not: {
        term: {
          _id: "randomid"
        }
      }
    }, {
      term: {
        contentType: "application/x-type"
      }
    }],
    attributes: [{
      attr: "size",
      value: 1
    }, {
      attr: "from",
      value: 19
    }]
  }];

  return function () {
    tests.forEach(function (test) {
      describe("query = " + JSON.stringify(test.query), function () {
        var result = {};

        before(function (done) {
          qb.search(test.query, function (err, query) {
            result.err = err;
            result.query = query;
            done();
          });
        });

        describe("Built Query:", function () {
          it("err should be undefined", function () {
            assert.strictEqual(result.err, null);
          });
          it("query should be defined", function () {
            assert(result.query);
          });
          it("Has correct attributes", function () {
            var filters = test.filters,
              attributes = test.attributes,
              i,
              l;
            for (i = 0, l = filters.length; i < l; i++) {
              assert.deepEqual(result.query.query.filtered.filter.bool.must[i], filters[i]);
            }
            if (attributes) {
              for (i = 0, l = attributes.length; i < l; i++) {
                assert.deepEqual(result.query[attributes[i].attr], attributes[i].value);
              }
            }
          });
        });
      });
    });
  };
};
