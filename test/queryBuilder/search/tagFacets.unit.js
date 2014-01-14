module.exports = function( qb ) {
  var assert = require( "assert" );

  function isValidTerm( term ) {
    return term && typeof term === "string";
  }

  function generateTestCase( term, size, expectedTerm, expectedSize ) {
    return {
      "term": term,
      "size": size,
      "expected": isValidTerm( expectedTerm || term ) ? {
        "query": {
          "match_all" : {}
        },
        "facets": {
          "tags": {
            "terms": {
              "field": "tags",
              "regex": "^" + ( expectedTerm || term ) + "[^:]*$",
              "size": ( expectedSize || size || 10 )
            }
          }
        },
        "size": 0
      } : null
    };
  }

  var tests = [
    // valid tag and size
    generateTestCase( "tag", 5 ),

    // tag is not a string
    generateTestCase( undefined, 10 ),
    generateTestCase( null, 10 ),
    generateTestCase( NaN, 10 ),
    generateTestCase( Infinity, 10 ),
    generateTestCase( -Infinity, 10 ),
    generateTestCase( {}, 10 ),
    generateTestCase( ["wat"], null ),
    generateTestCase( /regex\!/, 10 ),
    generateTestCase( 0x123F, 10 ),

    // invalid size values
    generateTestCase( "tag" ),
    generateTestCase( "tag", 1000, "tag", 100 ),
    generateTestCase( "tag", 0, "tag", 10 ),

    // weird size values should be ignored
    generateTestCase( "tag", null, "tag", 10 ),
    generateTestCase( "tag", undefined, "tag", 10 ),
    generateTestCase( "tag", Infinity, "tag", 100 ),
    generateTestCase( "tag", -Infinity, "tag", 10 ),
    generateTestCase( "tag", {}, "tag", 10 ),
    generateTestCase( "tag", [], "tag", 10 ),
    generateTestCase( "tag", ["wat"], "tag", 10 )
  ];

  return function facetRunner() {
    tests.forEach(function( testCase ){
      var dsl = qb.autocomplete( testCase.term, testCase.size );
      if ( testCase.term && typeof testCase.term === "string" ) {
        it( "dsl should exist", function() {
          assert( dsl );
        });
      }
      it( "return value should match expected object", function() {
        assert.deepEqual( dsl, testCase.expected );
      });
    });
  };
};
