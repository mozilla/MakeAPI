module.exports = function( qb ){
  var assert = require( "assert" );

  var filterTests = {
    author: [
      {
        args: [ { author: "name" } ],
        expected: { "term": { "author": "name" } }
      },
      {
        args: [ { author: "{!}name" } ],
        expected: { "not": { "term": { "author": "name" } } }
      }
    ],
    contentType: [
      {
        args: [ { contentType: "application/x-type" } ],
        expected: { "term": { "contentType": "application/x-type" } }
      },
      {
        args: [ { contentType: "{!}application/x-type" } ],
        expected: { "not": { "term": { "contentType": "application/x-type" } } }
      }
    ],
    description: [
      {
        args: [ { description: "This is a description" } ],
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
      },
      {
        args: [ { description: "{!}This is a description" } ],
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
      }
    ],
    id: [
      {
        args: [ { id: "randomidstring" } ],
        expected: { "query": { "field": { "_id": "randomidstring" } } }
      },
      {
        args: [ { id: "{!}randomidstring" } ],
        expected: { "not": { "query": { "field": { "_id": "randomidstring" } } } }
      }
    ],
    remixedFrom: [
      {
        args: [ { remixedFrom: "remixid" } ],
        expected: { "term": { "remixedFrom": "remixid" } }
      },
      {
        args: [ { remixedFrom: "{!}remixid" } ],
        expected: { "not": { "term": { "remixedFrom": "remixid" } } }
      }
    ],
    tags: [
      {
        args: [ { tags: "tag" } ],
        expected: {
          "terms": {
            "tags": [
              "tag"
            ]
          }
        }
      },
      {
        args: [ { tags: "tag,tag2" } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ]
          }
        }
      },
      {
        args: [ { tags: "tag,tag2,tag3" } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2",
              "tag3"
            ]
          }
        }
      },
      {
        args: [ { tags: "or,tag" } ],
        expected: {
          "terms": {
            "tags": [
              "tag"
            ],
            "execution": "or"
          }
        }
      },
      {
        args: [ { tags: "or,tag,tag2" } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ],
            "execution": "or"
          }
        }
      },
      {
        args: [ { tags: "or,tag,tag2,tag3" } ],
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
      },
      {
        args: [ { tags: "and,tag" } ],
        expected: {
          "terms": {
            "tags": [
              "tag"
            ],
            "execution": "and"
          }
        }
      },
      {
        args: [ { tags: "and,tag,tag2" } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ],
            "execution": "and"
          }
        }
      },
      {
        args: [ { tags: "and,tag,tag2,tag3" } ],
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
      },
      {
        args: [ { tags: "{!}tag" } ],
        expected: {
          "not": {
            "terms": {
              "tags": [
                "tag"
              ]
            }
          }
        }
      },
      {
        args: [ { tags: "{!}tag,tag2" } ],
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
      },
      {
        args: [ { tags: "{!}tag,tag2,tag3" } ],
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
      },
      {
        args: [ { tags: "{!}or,tag" } ],
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
      },
      {
        args: [ { tags: "{!}or,tag,tag2" } ],
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
      },
      {
        args: [ { tags: "{!}or,tag,tag2,tag3" } ],
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
      },
      {
        args: [ { tags: "{!}and,tag" } ],
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
      },
      {
        args: [ { tags: "{!}and,tag,tag2" } ],
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
      },
      {
        args: [ { tags: "{!}and,tag,tag2,tag3" } ],
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
      },
      {
        args: [ { tags: "  tag    " } ],
        expected: {
          "terms": {
            "tags": [
              "tag"
            ]
          }
        }
      },
      {
        args: [ { tags: "   tag,   tag2   " } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ]
          }
        }
      },
      {
        args: [ { tags: "   tag,tag2,   tag3" } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2",
              "tag3"
            ]
          }
        }
      },
      {
        args: [ { tags: "or,   tag" } ],
        expected: {
          "terms": {
            "tags": [
              "tag"
            ],
            "execution": "or"
          }
        }
      },
      {
        args: [ { tags: "or   ,tag,   tag2    " } ],
        expected: {
          "terms": {
            "tags": [
              "tag",
              "tag2"
            ],
            "execution": "or"
          }
        }
      },
      {
        args: [ { tags: "or,    tag,  tag2  ,tag3         " } ],
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
      }
    ],
    tagPrefix: [
      {
        args: [ { tagPrefix: "prefixString" } ],
        expected: {
          "prefix": {
            "tags": "prefixString"
          }
        }
      },
      {
        args: [ { tagPrefix: "{!}prefixString" } ],
        expected: {
          "not": {
            "prefix": {
              "tags": "prefixString"
            }
          }
        }
      }
    ],
    title: [
      {
        args: [ { title: "This is a title" } ],
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
      },
      {
        args: [ { title: "{!}This is a title" } ],
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
      }
    ],
    url: [
      {
        args: [ { url: "https://mozilla.org" } ],
        expected: {
          "term": {
            "url": "https://mozilla.org"
          }
        }
      },
      {
        args: [ { url: "{!}https://mozilla.org" } ],
        expected: {
          "not": {
            "term": {
              "url": "https://mozilla.org"
            }
          }
        }
      },
      {
        args: [ { url: "https%3A//mozilla.org" } ],
        expected: {
          "term": {
            "url": "https://mozilla.org"
          }
        }
      },
      {
        args: [ { url: "{!}https%3A//mozilla.org" } ],
        expected: {
          "not": {
            "term": {
              "url": "https://mozilla.org"
            }
          }
        }
      }
    ]
  };

  return function() {
    Object.keys( filterTests ).forEach(function( field ) {
      var tests = filterTests[ field ];
      tests.map(function( test ) {
        test.args.push(function( err, query ) {
          it( "err should be undefined", function() {
            assert.strictEqual( err, null );
          });
          it( "query should be defined", function(){
            assert( query );
          });
          it( "user filter should exist", function() {
            assert.deepEqual( query.query.filtered.filter.bool.must[ 0 ], test.expected );
          });
        });
        qb.build.apply( this, test.args );
      });
    });
  };
};
