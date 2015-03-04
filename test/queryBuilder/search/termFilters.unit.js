/* global describe, before, it */

module.exports = function (qb) {
  var assert = require("assert");

  var filterTests = {
    author: [{
      query: {
        author: "name"
      },
      expected: {
        "term": {
          "author": "name"
        }
      }
    }, {
      query: {
        author: "{!}name"
      },
      expected: {
        "not": {
          "term": {
            "author": "name"
          }
        }
      }
    }],
    contentType: [{
      query: {
        contentType: "application/x-type"
      },
      expected: {
        "term": {
          "contentType": "application/x-type"
        }
      }
    }, {
      query: {
        contentType: "{!}application/x-type"
      },
      expected: {
        "not": {
          "term": {
            "contentType": "application/x-type"
          }
        }
      }
    }],
    description: [{
      query: {
        description: "This is a description"
      },
      expected: {
        "query": {
          "match": {
            "description": {
              "query": "This is a description",
              "operator": "and"
            }
          }
        }
      }
    }, {
      query: {
        description: "{!}This is a description"
      },
      expected: {
        "not": {
          "query": {
            "match": {
              "description": {
                "query": "This is a description",
                "operator": "and"
              }
            }
          }
        }
      }
    }],
    id: [{
      query: {
        id: "randomidstring"
      },
      expected: {
        "term": {
          "_id": "randomidstring"
        }
      }
    }, {
      query: {
        id: "{!}randomidstring"
      },
      expected: {
        "not": {
          "term": {
            "_id": "randomidstring"
          }
        }
      }
    }, {
      query: {
        id: "id,id2"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2"
          ]
        }
      }
    }, {
      query: {
        id: "id,id2,id3"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2",
            "id3"
          ]
        }
      }
    }, {
      query: {
        id: "or,id"
      },
      expected: {
        "terms": {
          "_id": [
            "id"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        id: "or,id,id2"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        id: "or,id,id2,id3"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2",
            "id3"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        id: "and,id"
      },
      expected: {
        "terms": {
          "_id": [
            "id"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        id: "and,id,id2"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        id: "and,id,id2,id3"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2",
            "id3"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        id: "{!}id,id2"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2"
            ]
          }
        }
      }
    }, {
      query: {
        id: "{!}id,id2,id3"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2",
              "id3"
            ]
          }
        }
      }
    }, {
      query: {
        id: "{!}or,id"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        id: "{!}or,id,id2"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        id: "{!}or,id,id2,id3"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2",
              "id3"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        id: "{!}and,id"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        id: "{!}and,id,id2"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        id: "{!}and,id,id2,id3"
      },
      expected: {
        "not": {
          "terms": {
            "_id": [
              "id",
              "id2",
              "id3"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        id: "   id,   id2   "
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2"
          ]
        }
      }
    }, {
      query: {
        id: "   id,id2,   id3"
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2",
            "id3"
          ]
        }
      }
    }, {
      query: {
        id: "or,   id"
      },
      expected: {
        "terms": {
          "_id": [
            "id"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        id: "or   ,id,   id2    "
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        id: "or,    id,  id2  ,id3         "
      },
      expected: {
        "terms": {
          "_id": [
            "id",
            "id2",
            "id3"
          ],
          "execution": "or"
        }
      }
    }],
    remixedFrom: [{
      query: {
        remixedFrom: "remixid"
      },
      expected: {
        "term": {
          "remixedFrom": "remixid"
        }
      }
    }, {
      query: {
        remixedFrom: "{!}remixid"
      },
      expected: {
        "not": {
          "term": {
            "remixedFrom": "remixid"
          }
        }
      }
    }],
    tags: [{
      query: {
        tags: "tag"
      },
      expected: {
        "terms": {
          "tags": [
            "tag"
          ]
        }
      }
    }, {
      query: {
        tags: "tag,tag2"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2"
          ]
        }
      }
    }, {
      query: {
        tags: "tag,tag2,tag3"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2",
            "tag3"
          ]
        }
      }
    }, {
      query: {
        tags: "or,tag"
      },
      expected: {
        "terms": {
          "tags": [
            "tag"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        tags: "or,tag,tag2"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        tags: "or,tag,tag2,tag3"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2",
            "tag3"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        tags: "and,tag"
      },
      expected: {
        "terms": {
          "tags": [
            "tag"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        tags: "and,tag,tag2"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        tags: "and,tag,tag2,tag3"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2",
            "tag3"
          ],
          "execution": "and"
        }
      }
    }, {
      query: {
        tags: "{!}tag"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag"
            ]
          }
        }
      }
    }, {
      query: {
        tags: "{!}tag,tag2"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ]
          }
        }
      }
    }, {
      query: {
        tags: "{!}tag,tag2,tag3"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2",
              "tag3"
            ]
          }
        }
      }
    }, {
      query: {
        tags: "{!}or,tag"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        tags: "{!}or,tag,tag2"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        tags: "{!}or,tag,tag2,tag3"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2",
              "tag3"
            ],
            "execution": "or"
          }
        }
      }
    }, {
      query: {
        tags: "{!}and,tag"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        tags: "{!}and,tag,tag2"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        tags: "{!}and,tag,tag2,tag3"
      },
      expected: {
        "not": {
          "terms": {
            "tags": [
              "tag",
              "tag2",
              "tag3"
            ],
            "execution": "and"
          }
        }
      }
    }, {
      query: {
        tags: "  tag    "
      },
      expected: {
        "terms": {
          "tags": [
            "tag"
          ]
        }
      }
    }, {
      query: {
        tags: "   tag,   tag2   "
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2"
          ]
        }
      }
    }, {
      query: {
        tags: "   tag,tag2,   tag3"
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2",
            "tag3"
          ]
        }
      }
    }, {
      query: {
        tags: "or,   tag"
      },
      expected: {
        "terms": {
          "tags": [
            "tag"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        tags: "or   ,tag,   tag2    "
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2"
          ],
          "execution": "or"
        }
      }
    }, {
      query: {
        tags: "or,    tag,  tag2  ,tag3         "
      },
      expected: {
        "terms": {
          "tags": [
            "tag",
            "tag2",
            "tag3"
          ],
          "execution": "or"
        }
      }
    }],
    tagPrefix: [{
      query: {
        tagPrefix: "prefixString"
      },
      expected: {
        "prefix": {
          "tags": "prefixString"
        }
      }
    }, {
      query: {
        tagPrefix: "{!}prefixString"
      },
      expected: {
        "not": {
          "prefix": {
            "tags": "prefixString"
          }
        }
      }
    }],
    title: [{
      query: {
        title: "This is a title"
      },
      expected: {
        "query": {
          "match": {
            "title": {
              "query": "This is a title",
              "operator": "and"
            }
          }
        }
      }
    }, {
      query: {
        title: "{!}This is a title"
      },
      expected: {
        "not": {
          "query": {
            "match": {
              "title": {
                "query": "This is a title",
                "operator": "and"
              }
            }
          }
        }
      }
    }],
    url: [{
      query: {
        url: "https://mozilla.org"
      },
      expected: {
        "term": {
          "url": "https://mozilla.org"
        }
      }
    }, {
      query: {
        url: "{!}https://mozilla.org"
      },
      expected: {
        "not": {
          "term": {
            "url": "https://mozilla.org"
          }
        }
      }
    }]
  };

  return function () {
    Object.keys(filterTests).forEach(function (field) {
      var tests = filterTests[field];
      tests.forEach(function (test) {
        describe("field = " + field + " query = " + JSON.stringify(test.query), function () {
          var result = {};

          before(function (done) {
            qb.search(test.query, function (err, query) {
              result.err = err;
              result.query = query;
              done();
            });
          });

          describe("Built Query", function () {
            it("err should be undefined", function () {
              assert.strictEqual(result.err, null);
            });
            it("query should be defined", function () {
              assert(result.query);
            });
            it("term[s] filter should exist", function () {
              assert.deepEqual(result.query.query.filtered.filter.bool.must[0], test.expected);
            });
          });
        });
      });
    });
  };
};
