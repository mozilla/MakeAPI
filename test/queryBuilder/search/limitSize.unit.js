module.exports = function( qb ) {
  var assert = require( "assert" );

  var tests = [
    {
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
      limit: function() {},
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
    }
  ];

  return function() {
    var testNum;
    tests.forEach(function( test, idx ) {
      qb.search( { page: test.page, limit: test.limit }, function( err, query ) {
        testNum = idx + 1;
        it( "err should be null - test #" + testNum, function() {
          assert.strictEqual( err, null );
        });
        it( "query should be defined - test #" + testNum, function(){
          assert( query );
        });
        it( "from and size match expected - test #" + testNum, function() {
          assert.strictEqual( query.from, test.expected.from );
          assert.strictEqual( query.size, test.expected.size );
        });
      });
    });
  };
};
