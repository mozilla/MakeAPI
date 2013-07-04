module.exports = function( qb ) {
  var assert = require( "assert" );

  tests = [
    {
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
    }
  ];


  return function() {
    tests.forEach(function( test ) {
      qb.build( { limit: test.limit }, function( err, query ) {
        it( "err should be null", function() {
          assert.strictEqual( err, null );
        });
        it( "query should be defined", function() {
          assert( query );
        });
        it( "query.size should be set to " + test.expected, function() {
          assert.strictEqual( query.size, test.expected );
        });
      });
    });
  };
};
